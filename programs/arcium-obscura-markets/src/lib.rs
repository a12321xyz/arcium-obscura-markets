use anchor_lang::prelude::*;
use solana_program::keccak;
use anchor_lang::system_program;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::CallbackAccount;
use arcium_anchor::traits::QueueCompAccs;

const COMP_DEF_OFFSET_INIT_MARKET_STATE: u32 = comp_def_offset("init_m8");
const COMP_DEF_OFFSET_PLACE_BET: u32 = comp_def_offset("place_bet");
const COMP_DEF_OFFSET_RESOLVE_PREDICTION_MARKET: u32 = comp_def_offset("resolve_prediction_market");
const COMP_DEF_OFFSET_RESOLVE_OPINION_MARKET: u32 = comp_def_offset("resolve_opinion_market");

const MARKET_SEED: &[u8] = b"market";
const BET_SEED: &[u8] = b"bet";
const RESOLUTION_SEED: &[u8] = b"resolution";
const VAULT_SEED: &[u8] = b"vault";
const BET_COMMITMENT_DOMAIN: &[u8] = b"arcium-obscura-markets-v1";
const MAX_OUTCOMES: usize = 4;
const PAYOUT_SCALE: u64 = 1_000_000;

// Offset of Market.encrypted_state inside the serialized account:
// discriminator(8) + bump(1) + vault_bump(1) + creator(32) + market_id(8)
// + kind(1) + status(1) + outcome_count(1) + end_time(8) + quorum(4)
// + next_bet_id(8) + accepted_bet_count(4) + public_max_escrow_lamports(8)
// + public_pool_lamports(8) + state_nonce(16) = 109.
const ENCRYPTED_STATE_OFFSET: u32 = 109;
const ENCRYPTED_STATE_SIZE: u32 = 32 * 6;

declare_id!("4Bong499epakUpBjRxnfjouWnmXg718yu2KpJeRQv9yZ");

#[arcium_program]
pub mod arcium_obscura_markets {
    use super::*;

    pub fn init_m8_comp_def(ctx: Context<InitM8CompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)
    }

    pub fn init_place_bet_comp_def(ctx: Context<InitPlaceBetCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)
    }

    pub fn init_resolve_prediction_market_comp_def(
        ctx: Context<InitResolvePredictionMarketCompDef>,
    ) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)
    }

    pub fn init_resolve_opinion_market_comp_def(
        ctx: Context<InitResolveOpinionMarketCompDef>,
    ) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)
    }

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        computation_offset: u64,
        market_id: u64,
        kind: MarketKind,
        question: String,
        outcomes: Vec<String>,
        end_time: i64,
        quorum: u32,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(end_time > clock.unix_timestamp, ErrorCode::MarketEnded);
        require!(outcomes.len() >= 2, ErrorCode::InvalidOutcomeCount);
        require!(outcomes.len() <= MAX_OUTCOMES, ErrorCode::InvalidOutcomeCount);
        require!(question.as_bytes().len() <= 160, ErrorCode::QuestionTooLong);
        for outcome in &outcomes {
            require!(outcome.as_bytes().len() <= 32, ErrorCode::OutcomeTooLong);
        }
        if kind == MarketKind::Opinion {
            require!(quorum > 0, ErrorCode::InvalidQuorum);
        }

        let market_key = ctx.accounts.market.key();

        let market = &mut ctx.accounts.market;
        market.bump = ctx.bumps.market;
        market.vault_bump = ctx.bumps.vault;
        market.creator = ctx.accounts.creator.key();
        market.market_id = market_id;
        market.kind = kind;
        market.status = MarketStatus::Initializing;
        market.outcome_count = outcomes.len() as u8;
        market.end_time = end_time;
        market.quorum = quorum;
        market.next_bet_id = 0;
        market.accepted_bet_count = 0;
        market.public_max_escrow_lamports = 0;
        market.public_pool_lamports = 0;
        market.state_nonce = 0;
        market.encrypted_state = [[0u8; 32]; 6];
        market.public_outcome_pools = [0u64; MAX_OUTCOMES];
        market.question = question;
        market.outcomes = outcomes;

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        msg!("Sign PDA: {}", ctx.accounts.sign_pda_account.key());
        msg!("Cluster Account: {}", ctx.accounts.cluster_account.key());
        msg!("Sign PDA Bump: {}", ctx.accounts.sign_pda_account.bump);

        let args = ArgBuilder::new().build();
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![InitM8Callback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[CallbackAccount {
                    pubkey: market_key,
                    is_writable: true,
                }],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_m8")]
    pub fn init_m8_callback(
        ctx: Context<InitM8Callback>,
        output: SignedComputationOutputs<InitM8Output>,
    ) -> Result<()> {
        let encrypted_state = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(InitM8Output { field_0 }) => field_0,
            Err(e) => {
                msg!("Verify output failed with error: {:?}", e);
                return Err(ErrorCode::AbortedComputation.into());
            }
        };

        let market = &mut ctx.accounts.market;
        market.encrypted_state = encrypted_state.ciphertexts;
        market.state_nonce = encrypted_state.nonce;
        market.status = MarketStatus::Open;

        emit!(MarketInitializedEvent {
            market: market.key(),
            creator: market.creator,
            market_id: market.market_id,
            kind: market.kind,
            end_time: market.end_time,
        });

        Ok(())
    }

    pub fn place_encrypted_bet(
        ctx: Context<PlaceEncryptedBet>,
        computation_offset: u64,
        bet_id: u64,
        encrypted_amount: [u8; 32],
        encrypted_outcome: [u8; 32],
        bettor_pubkey: [u8; 32],
        nonce: u128,
        commitment: [u8; 32],
        max_stake_lamports: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let market_key = ctx.accounts.market.key();
        let bettor_key = ctx.accounts.bettor.key();
        let bet_key = ctx.accounts.bet.key();
        let vault_key = ctx.accounts.vault.key();

        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(clock.unix_timestamp < market.end_time, ErrorCode::MarketEnded);
        require!(bet_id == market.next_bet_id, ErrorCode::InvalidBetId);
        require!(max_stake_lamports > 0, ErrorCode::InvalidStake);

        let bet = &mut ctx.accounts.bet;
        bet.bump = ctx.bumps.bet;
        bet.market = market_key;
        bet.bettor = bettor_key;
        bet.bet_id = bet_id;
        bet.status = BetStatus::Pending;
        bet.max_stake_lamports = max_stake_lamports;
        bet.commitment = commitment;
        bet.encrypted_amount = encrypted_amount;
        bet.encrypted_outcome = encrypted_outcome;
        bet.encryption_pubkey = bettor_pubkey;
        bet.nonce = nonce;
        bet.created_at = clock.unix_timestamp;
        bet.claimed = false;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.bettor.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            max_stake_lamports,
        )?;

        market.next_bet_id = market
            .next_bet_id
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        market.public_max_escrow_lamports = market
            .public_max_escrow_lamports
            .checked_add(max_stake_lamports)
            .ok_or(ErrorCode::MathOverflow)?;

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new()
            .x25519_pubkey(bettor_pubkey)
            .plaintext_u128(nonce)
            .encrypted_u64(encrypted_amount)
            .encrypted_u8(encrypted_outcome)
            .plaintext_u8(market.outcome_count)
            .plaintext_u64(max_stake_lamports)
            .plaintext_u128(market.state_nonce)
            .account(market_key, ENCRYPTED_STATE_OFFSET, ENCRYPTED_STATE_SIZE)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![PlaceBetCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: market_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: bet_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: vault_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: bettor_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: system_program::ID,
                        is_writable: false,
                    },
                ],
            )?],
            1,
            0,
        )?;

        emit!(EncryptedBetQueuedEvent {
            market: market_key,
            bet: bet_key,
            bettor: bettor_key,
            bet_id,
            max_stake_lamports,
        });

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "place_bet")]
    pub fn place_bet_callback(
        ctx: Context<PlaceBetCallback>,
        output: SignedComputationOutputs<PlaceBetOutput>,
    ) -> Result<()> {
        let (encrypted_state, accepted, total_pool, pool_0, pool_1, pool_2, pool_3) =
            match output.verify_output(
                &ctx.accounts.cluster_account,
                &ctx.accounts.computation_account,
            ) {
                Ok(PlaceBetOutput {
                    field_0:
                        PlaceBetOutputStruct0 {
                            field_0,
                            field_1,
                            field_2,
                            field_3,
                            field_4,
                            field_5,
                            field_6,
                        },
                }) => (field_0, field_1, field_2, field_3, field_4, field_5, field_6),
                Err(_) => return Err(ErrorCode::AbortedComputation.into()),
            };

        let market_key = ctx.accounts.market.key();
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        require!(bet.market == market_key, ErrorCode::InvalidBetMarket);
        require!(bet.status == BetStatus::Pending, ErrorCode::InvalidBetStatus);

        if accepted {
            market.encrypted_state = encrypted_state.ciphertexts;
            market.state_nonce = encrypted_state.nonce;
            market.accepted_bet_count = market
                .accepted_bet_count
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
            market.public_pool_lamports = total_pool;
            market.public_outcome_pools = [pool_0, pool_1, pool_2, pool_3];
            bet.status = BetStatus::Accepted;
        } else {
            bet.status = BetStatus::Rejected;
            refund_from_vault(
                &ctx.accounts.vault,
                ctx.accounts.bettor.to_account_info(),
                &ctx.accounts.system_program,
                market_key,
                market.vault_bump,
                bet.max_stake_lamports,
            )?;
        }

        emit!(EncryptedBetFinalizedEvent {
            market: market_key,
            bet: bet.key(),
            bettor: bet.bettor,
            bet_id: bet.bet_id,
            accepted,
            public_pool_lamports: market.public_pool_lamports,
        });

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolvePredictionMarket>,
        computation_offset: u64,
        winning_outcome: u8,
    ) -> Result<()> {
        let market_key = ctx.accounts.market.key();
        let resolution_key = ctx.accounts.resolution.key();

        let market = &mut ctx.accounts.market;
        require!(market.kind == MarketKind::Prediction, ErrorCode::WrongMarketKind);
        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(Clock::get()?.unix_timestamp >= market.end_time, ErrorCode::MarketNotEnded);
        require!(ctx.accounts.resolver.key() == market.creator, ErrorCode::Unauthorized);
        require!(winning_outcome < market.outcome_count, ErrorCode::InvalidOutcome);

        market.status = MarketStatus::Resolving;
        init_resolution_account(
            &mut ctx.accounts.resolution,
            ctx.bumps.resolution,
            market_key,
        );
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new()
            .plaintext_u128(market.state_nonce)
            .account(market_key, ENCRYPTED_STATE_OFFSET, ENCRYPTED_STATE_SIZE)
            .plaintext_u8(winning_outcome)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![ResolvePredictionMarketCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: market_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: resolution_key,
                        is_writable: true,
                    },
                ],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "resolve_prediction_market")]
    pub fn resolve_prediction_market_callback(
        ctx: Context<ResolvePredictionMarketCallback>,
        output: SignedComputationOutputs<ResolvePredictionMarketOutput>,
    ) -> Result<()> {
        let (winning_outcome, total_pool, winning_pool, payout_ratio, quorum_met) =
            match output.verify_output(
                &ctx.accounts.cluster_account,
                &ctx.accounts.computation_account,
            ) {
                Ok(ResolvePredictionMarketOutput {
                    field_0:
                        ResolvePredictionMarketOutputStruct0 {
                            field_0,
                            field_1,
                            field_2,
                            field_3,
                            field_4,
                        },
                }) => (field_0, field_1, field_2, field_3, field_4),
                Err(e) => {
                    msg!("Verify output failed: {:?}", e);
                    return Err(ErrorCode::AbortedComputation.into());
                }
            };

        finalize_resolution(
            &mut ctx.accounts.market,
            &mut ctx.accounts.resolution,
            winning_outcome,
            total_pool,
            winning_pool,
            payout_ratio,
            quorum_met,
        )
    }

    pub fn resolve_opinion_market(
        ctx: Context<ResolveOpinionMarket>,
        computation_offset: u64,
    ) -> Result<()> {
        let market_key = ctx.accounts.market.key();
        let resolution_key = ctx.accounts.resolution.key();

        let market = &mut ctx.accounts.market;
        require!(market.kind == MarketKind::Opinion, ErrorCode::WrongMarketKind);
        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(Clock::get()?.unix_timestamp >= market.end_time, ErrorCode::MarketNotEnded);
        require!(ctx.accounts.resolver.key() == market.creator, ErrorCode::Unauthorized);

        market.status = MarketStatus::Resolving;
        init_resolution_account(
            &mut ctx.accounts.resolution,
            ctx.bumps.resolution,
            market_key,
        );
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        let args = ArgBuilder::new()
            .plaintext_u128(market.state_nonce)
            .account(market_key, ENCRYPTED_STATE_OFFSET, ENCRYPTED_STATE_SIZE)
            .plaintext_u32(market.quorum)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![ResolveOpinionMarketCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: market_key,
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: resolution_key,
                        is_writable: true,
                    },
                ],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "resolve_opinion_market")]
    pub fn resolve_opinion_market_callback(
        ctx: Context<ResolveOpinionMarketCallback>,
        output: SignedComputationOutputs<ResolveOpinionMarketOutput>,
    ) -> Result<()> {
        let (winning_outcome, total_pool, winning_pool, payout_ratio, quorum_met) =
            match output.verify_output(
                &ctx.accounts.cluster_account,
                &ctx.accounts.computation_account,
            ) {
                Ok(ResolveOpinionMarketOutput {
                    field_0:
                        ResolveOpinionMarketOutputStruct0 {
                            field_0,
                            field_1,
                            field_2,
                            field_3,
                            field_4,
                        },
                }) => (field_0, field_1, field_2, field_3, field_4),
                Err(e) => {
                    msg!("Verify output failed: {:?}", e);
                    return Err(ErrorCode::AbortedComputation.into());
                }
            };

        finalize_resolution(
            &mut ctx.accounts.market,
            &mut ctx.accounts.resolution,
            winning_outcome,
            total_pool,
            winning_pool,
            payout_ratio,
            quorum_met,
        )
    }

    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
        bet_id: u64,
        amount: u64,
        outcome: u8,
        salt: [u8; 32],
    ) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        let resolution = &mut ctx.accounts.resolution;

        require!(
            market.status == MarketStatus::Resolved || market.status == MarketStatus::Cancelled,
            ErrorCode::MarketNotResolved
        );
        require!(bet.status == BetStatus::Accepted, ErrorCode::InvalidBetStatus);
        require!(!bet.claimed, ErrorCode::BetAlreadyClaimed);
        require!(bet.bet_id == bet_id, ErrorCode::InvalidBetId);
        require!(bet.bettor == ctx.accounts.bettor.key(), ErrorCode::Unauthorized);
        require!(bet.market == market.key(), ErrorCode::InvalidBetMarket);
        require!(amount <= bet.max_stake_lamports, ErrorCode::InvalidStake);
        require!(outcome < market.outcome_count, ErrorCode::InvalidOutcome);

        let market_key = market.key();
        let expected_commitment = bet_commitment(
            market_key,
            bet.bettor,
            bet.bet_id,
            amount,
            outcome,
            salt,
        );
        require!(expected_commitment == bet.commitment, ErrorCode::InvalidBetReveal);

        let payout = calculate_claim_amount(
            market.status,
            bet.max_stake_lamports,
            amount,
            outcome,
            resolution.winning_outcome,
            resolution.winning_pool_lamports,
            resolution.payout_ratio,
        )?;

        bet.claimed = true;
        resolution.claimed_count = resolution
            .claimed_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        refund_from_vault(
            &ctx.accounts.vault,
            ctx.accounts.bettor.to_account_info(),
            &ctx.accounts.system_program,
            market_key,
            market.vault_bump,
            payout,
        )?;

        emit!(WinningsClaimedEvent {
            market: market_key,
            bet: bet.key(),
            bettor: bet.bettor,
            bet_id,
            payout_lamports: payout,
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub bump: u8,
    pub vault_bump: u8,
    pub creator: Pubkey,
    pub market_id: u64,
    pub kind: MarketKind,
    pub status: MarketStatus,
    pub outcome_count: u8,
    pub end_time: i64,
    pub quorum: u32,
    pub next_bet_id: u64,
    pub accepted_bet_count: u32,
    pub public_max_escrow_lamports: u64,
    pub public_pool_lamports: u64,
    pub state_nonce: u128,
    pub encrypted_state: [[u8; 32]; 6],
    pub public_outcome_pools: [u64; MAX_OUTCOMES],
    #[max_len(160)]
    pub question: String,
    #[max_len(4, 32)]
    pub outcomes: Vec<String>,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub bump: u8,
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub bet_id: u64,
    pub status: BetStatus,
    pub max_stake_lamports: u64,
    pub commitment: [u8; 32],
    pub encrypted_amount: [u8; 32],
    pub encrypted_outcome: [u8; 32],
    pub encryption_pubkey: [u8; 32],
    pub nonce: u128,
    pub created_at: i64,
    pub claimed: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Resolution {
    pub bump: u8,
    pub market: Pubkey,
    pub winning_outcome: u8,
    pub total_pool_lamports: u64,
    pub winning_pool_lamports: u64,
    pub payout_ratio: u64,
    pub quorum_met: bool,
    pub resolved_at: i64,
    pub claimed_count: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarketKind {
    Prediction,
    Opinion,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Initializing,
    Open,
    Resolving,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BetStatus {
    Pending,
    Accepted,
    Rejected,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64, market_id: u64, kind: MarketKind, question: String, outcomes: Vec<String>, end_time: i64, quorum: u32)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, creator.key().as_ref(), &market_id.to_le_bytes()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump,
    )]
    /// CHECK: vault PDA
    pub vault: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = creator,
        seeds = [&SIGN_PDA_SEED],
        bump,
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_MARKET_STATE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

impl<'info> QueueCompAccs<'info> for InitializeMarket<'info> {
    fn comp_def_offset(&self) -> u32 {
        COMP_DEF_OFFSET_INIT_MARKET_STATE
    }
    fn queue_comp_accs(&self) -> arcium_client::idl::arcium::cpi::accounts::QueueComputation<'info> {
        arcium_client::idl::arcium::cpi::accounts::QueueComputation {
            cluster: self.cluster_account.to_account_info(),
            mxe: self.mxe_account.to_account_info(),
            mempool: self.mempool_account.to_account_info(),
            executing_pool: self.executing_pool.to_account_info(),
            comp: self.computation_account.to_account_info(),
            comp_def_acc: self.comp_def_account.to_account_info(),
            pool_account: self.pool_account.to_account_info(),
            clock: self.clock_account.to_account_info(),
            signer: self.creator.to_account_info(),
            system_program: self.system_program.to_account_info(),
            sign_seed: self.sign_pda_account.to_account_info(),
        }
    }
    fn arcium_program(&self) -> AccountInfo<'info> {
        self.arcium_program.to_account_info()
    }
    fn mxe_program(&self) -> Pubkey {
        crate::ID
    }
    fn signer_pda_bump(&self) -> u8 {
        self.sign_pda_account.bump
    }
}

#[callback_accounts("init_m8")]
#[derive(Accounts)]
pub struct InitM8Callback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_MARKET_STATE))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: checked by callback account constraints.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: checked by account constraint.
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64, bet_id: u64)]
pub struct PlaceEncryptedBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [BET_SEED, market.key().as_ref(), &bet_id.to_le_bytes()],
        bump,
    )]
    pub bet: Box<Account<'info, Bet>>,
    #[account(mut, seeds = [VAULT_SEED, market.key().as_ref()], bump = market.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = bettor,
        seeds = [&SIGN_PDA_SEED],
        bump,
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_PLACE_BET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

impl<'info> QueueCompAccs<'info> for PlaceEncryptedBet<'info> {
    fn comp_def_offset(&self) -> u32 {
        COMP_DEF_OFFSET_PLACE_BET
    }
    fn queue_comp_accs(&self) -> arcium_client::idl::arcium::cpi::accounts::QueueComputation<'info> {
        arcium_client::idl::arcium::cpi::accounts::QueueComputation {
            cluster: self.cluster_account.to_account_info(),
            mxe: self.mxe_account.to_account_info(),
            mempool: self.mempool_account.to_account_info(),
            executing_pool: self.executing_pool.to_account_info(),
            comp: self.computation_account.to_account_info(),
            comp_def_acc: self.comp_def_account.to_account_info(),
            pool_account: self.pool_account.to_account_info(),
            clock: self.clock_account.to_account_info(),
            signer: self.bettor.to_account_info(),
            system_program: self.system_program.to_account_info(),
            sign_seed: self.sign_pda_account.to_account_info(),
        }
    }
    fn arcium_program(&self) -> AccountInfo<'info> {
        self.arcium_program.to_account_info()
    }
    fn mxe_program(&self) -> Pubkey {
        crate::ID
    }
    fn signer_pda_bump(&self) -> u8 {
        self.sign_pda_account.bump
    }
}

#[callback_accounts("place_bet")]
#[derive(Accounts)]
pub struct PlaceBetCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_PLACE_BET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: checked by callback account constraints.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: checked by account constraint.
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(mut)]
    pub bet: Box<Account<'info, Bet>>,
    #[account(mut, seeds = [VAULT_SEED, market.key().as_ref()], bump = market.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut, address = bet.bettor)]
    /// CHECK: recipient checked against bet.bettor.
    pub bettor: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ResolvePredictionMarket<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(
        init,
        payer = resolver,
        space = 8 + Resolution::INIT_SPACE,
        seeds = [RESOLUTION_SEED, market.key().as_ref()],
        bump,
    )]
    pub resolution: Box<Account<'info, Resolution>>,
    #[account(
        init_if_needed,
        space = 9,
        payer = resolver,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RESOLVE_PREDICTION_MARKET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub pool_clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

impl<'info> QueueCompAccs<'info> for ResolvePredictionMarket<'info> {
    fn comp_def_offset(&self) -> u32 {
        COMP_DEF_OFFSET_RESOLVE_PREDICTION_MARKET
    }
    fn queue_comp_accs(&self) -> arcium_client::idl::arcium::cpi::accounts::QueueComputation<'info> {
        arcium_client::idl::arcium::cpi::accounts::QueueComputation {
            cluster: self.cluster_account.to_account_info(),
            mxe: self.mxe_account.to_account_info(),
            mempool: self.mempool_account.to_account_info(),
            executing_pool: self.executing_pool.to_account_info(),
            comp: self.computation_account.to_account_info(),
            comp_def_acc: self.comp_def_account.to_account_info(),
            pool_account: self.pool_account.to_account_info(),
            clock: self.pool_clock_account.to_account_info(),
            signer: self.resolver.to_account_info(),
            system_program: self.system_program.to_account_info(),
            sign_seed: self.sign_pda_account.to_account_info(),
        }
    }
    fn arcium_program(&self) -> AccountInfo<'info> {
        self.arcium_program.to_account_info()
    }
    fn mxe_program(&self) -> Pubkey {
        crate::ID
    }
    fn signer_pda_bump(&self) -> u8 {
        self.sign_pda_account.bump
    }
}

#[callback_accounts("resolve_prediction_market")]
#[derive(Accounts)]
pub struct ResolvePredictionMarketCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RESOLVE_PREDICTION_MARKET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: checked by callback account constraints.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: checked by account constraint.
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(mut, seeds = [RESOLUTION_SEED, market.key().as_ref()], bump = resolution.bump)]
    pub resolution: Box<Account<'info, Resolution>>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ResolveOpinionMarket<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(
        init,
        payer = resolver,
        space = 8 + Resolution::INIT_SPACE,
        seeds = [RESOLUTION_SEED, market.key().as_ref()],
        bump,
    )]
    pub resolution: Box<Account<'info, Resolution>>,
    #[account(
        init_if_needed,
        space = 9,
        payer = resolver,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Box<Account<'info, ArciumSignerAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut, address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet))]
    /// CHECK: checked by the Arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RESOLVE_OPINION_MARKET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(mut, address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub pool_clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

impl<'info> QueueCompAccs<'info> for ResolveOpinionMarket<'info> {
    fn comp_def_offset(&self) -> u32 {
        COMP_DEF_OFFSET_RESOLVE_OPINION_MARKET
    }
    fn queue_comp_accs(&self) -> arcium_client::idl::arcium::cpi::accounts::QueueComputation<'info> {
        arcium_client::idl::arcium::cpi::accounts::QueueComputation {
            cluster: self.cluster_account.to_account_info(),
            mxe: self.mxe_account.to_account_info(),
            mempool: self.mempool_account.to_account_info(),
            executing_pool: self.executing_pool.to_account_info(),
            comp: self.computation_account.to_account_info(),
            comp_def_acc: self.comp_def_account.to_account_info(),
            pool_account: self.pool_account.to_account_info(),
            clock: self.pool_clock_account.to_account_info(),
            signer: self.resolver.to_account_info(),
            system_program: self.system_program.to_account_info(),
            sign_seed: self.sign_pda_account.to_account_info(),
        }
    }
    fn arcium_program(&self) -> AccountInfo<'info> {
        self.arcium_program.to_account_info()
    }
    fn mxe_program(&self) -> Pubkey {
        crate::ID
    }
    fn signer_pda_bump(&self) -> u8 {
        self.sign_pda_account.bump
    }
}

#[callback_accounts("resolve_opinion_market")]
#[derive(Accounts)]
pub struct ResolveOpinionMarketCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RESOLVE_OPINION_MARKET))]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    /// CHECK: checked by callback account constraints.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: checked by account constraint.
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(mut, seeds = [RESOLUTION_SEED, market.key().as_ref()], bump = resolution.bump)]
    pub resolution: Box<Account<'info, Resolution>>,
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
    #[account(
        mut,
        seeds = [BET_SEED, market.key().as_ref(), &bet_id.to_le_bytes()],
        bump = bet.bump,
    )]
    pub bet: Box<Account<'info, Bet>>,
    #[account(mut, seeds = [RESOLUTION_SEED, market.key().as_ref()], bump = resolution.bump)]
    pub resolution: Box<Account<'info, Resolution>>,
    #[account(mut, seeds = [VAULT_SEED, market.key().as_ref()], bump = market.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("init_m8", payer)]
#[derive(Accounts)]
pub struct InitM8CompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(mut)]
    /// CHECK: checked by Arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: checked by Arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: address lookup table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("place_bet", payer)]
#[derive(Accounts)]
pub struct InitPlaceBetCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(mut)]
    /// CHECK: checked by Arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: checked by Arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: address lookup table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("resolve_prediction_market", payer)]
#[derive(Accounts)]
pub struct InitResolvePredictionMarketCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(mut)]
    /// CHECK: checked by Arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: checked by Arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: address lookup table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("resolve_opinion_market", payer)]
#[derive(Accounts)]
pub struct InitResolveOpinionMarketCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(mut)]
    /// CHECK: checked by Arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: checked by Arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: address lookup table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MarketInitializedEvent {
    pub market: Pubkey,
    pub creator: Pubkey,
    pub market_id: u64,
    pub kind: MarketKind,
    pub end_time: i64,
}

#[event]
pub struct EncryptedBetQueuedEvent {
    pub market: Pubkey,
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub bet_id: u64,
    pub max_stake_lamports: u64,
}

#[event]
pub struct EncryptedBetFinalizedEvent {
    pub market: Pubkey,
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub bet_id: u64,
    pub accepted: bool,
    pub public_pool_lamports: u64,
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub winning_outcome: u8,
    pub total_pool_lamports: u64,
    pub winning_pool_lamports: u64,
    pub payout_ratio: u64,
    pub quorum_met: bool,
    pub status: MarketStatus,
}

#[event]
pub struct WinningsClaimedEvent {
    pub market: Pubkey,
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub bet_id: u64,
    pub payout_lamports: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The Arcium computation was aborted")]
    AbortedComputation,
    #[msg("Arcium cluster is not set")]
    ClusterNotSet,
    #[msg("Market has already ended")]
    MarketEnded,
    #[msg("Market has not ended")]
    MarketNotEnded,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market is not resolved")]
    MarketNotResolved,
    #[msg("Wrong market kind for this instruction")]
    WrongMarketKind,
    #[msg("Question is too long")]
    QuestionTooLong,
    #[msg("Outcome is too long")]
    OutcomeTooLong,
    #[msg("Invalid outcome count")]
    InvalidOutcomeCount,
    #[msg("Invalid outcome")]
    InvalidOutcome,
    #[msg("Invalid quorum")]
    InvalidQuorum,
    #[msg("Invalid bet id")]
    InvalidBetId,
    #[msg("Invalid stake")]
    InvalidStake,
    #[msg("Invalid bet status")]
    InvalidBetStatus,
    #[msg("Invalid bet market")]
    InvalidBetMarket,
    #[msg("Bet reveal does not match original commitment")]
    InvalidBetReveal,
    #[msg("Bet already claimed")]
    BetAlreadyClaimed,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}

fn init_resolution_account(resolution: &mut Account<Resolution>, bump: u8, market: Pubkey) {
    resolution.bump = bump;
    resolution.market = market;
    resolution.winning_outcome = 0;
    resolution.total_pool_lamports = 0;
    resolution.winning_pool_lamports = 0;
    resolution.payout_ratio = PAYOUT_SCALE;
    resolution.quorum_met = false;
    resolution.resolved_at = 0;
    resolution.claimed_count = 0;
}

fn finalize_resolution(
    market: &mut Account<Market>,
    resolution: &mut Account<Resolution>,
    winning_outcome: u8,
    total_pool_lamports: u64,
    winning_pool_lamports: u64,
    payout_ratio: u64,
    quorum_met: bool,
) -> Result<()> {
    require!(resolution.market == market.key(), ErrorCode::InvalidBetMarket);

    market.status = if quorum_met {
        MarketStatus::Resolved
    } else {
        MarketStatus::Cancelled
    };
    market.public_pool_lamports = total_pool_lamports;

    resolution.winning_outcome = winning_outcome;
    resolution.total_pool_lamports = total_pool_lamports;
    resolution.winning_pool_lamports = winning_pool_lamports;
    resolution.payout_ratio = payout_ratio;
    resolution.quorum_met = quorum_met;
    resolution.resolved_at = Clock::get()?.unix_timestamp;

    emit!(MarketResolvedEvent {
        market: market.key(),
        winning_outcome,
        total_pool_lamports,
        winning_pool_lamports,
        payout_ratio,
        quorum_met,
        status: market.status,
    });

    Ok(())
}

fn bet_commitment(
    market: Pubkey,
    bettor: Pubkey,
    bet_id: u64,
    amount: u64,
    outcome: u8,
    salt: [u8; 32],
) -> [u8; 32] {
    keccak::hashv(&[
        BET_COMMITMENT_DOMAIN,
        market.as_ref(),
        bettor.as_ref(),
        &bet_id.to_le_bytes(),
        &amount.to_le_bytes(),
        &[outcome],
        &salt,
    ])
    .to_bytes()
}

fn calculate_claim_amount(
    status: MarketStatus,
    max_stake_lamports: u64,
    amount: u64,
    outcome: u8,
    winning_outcome: u8,
    winning_pool_lamports: u64,
    payout_ratio: u64,
) -> Result<u64> {
    if status == MarketStatus::Cancelled || winning_pool_lamports == 0 {
        return Ok(max_stake_lamports);
    }

    let unused_escrow = max_stake_lamports
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    if outcome != winning_outcome {
        return Ok(unused_escrow);
    }

    let winning_payout = (amount as u128)
        .checked_mul(payout_ratio as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(PAYOUT_SCALE as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    let winning_payout: u64 = winning_payout
        .try_into()
        .map_err(|_| ErrorCode::MathOverflow)?;

    unused_escrow
        .checked_add(winning_payout)
        .ok_or(ErrorCode::MathOverflow.into())
}

fn refund_from_vault<'info>(
    vault: &SystemAccount<'info>,
    recipient: AccountInfo<'info>,
    system_program: &Program<'info, System>,
    market: Pubkey,
    vault_bump: u8,
    lamports: u64,
) -> Result<()> {
    if lamports == 0 {
        return Ok(());
    }

    let signer_seeds: &[&[&[u8]]] = &[&[VAULT_SEED, market.as_ref(), &[vault_bump]]];
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            system_program::Transfer {
                from: vault.to_account_info(),
                to: recipient,
            },
            signer_seeds,
        ),
        lamports,
    )
}

