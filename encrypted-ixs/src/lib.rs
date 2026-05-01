use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct BetInput {
        pub amount: u64,
        pub outcome: u8,
    }

    pub struct MarketPrivateState {
        pub total_pool: u64,
        pub outcome_0_pool: u64,
        pub outcome_1_pool: u64,
        pub outcome_2_pool: u64,
        pub outcome_3_pool: u64,
        pub bet_count: u64,
    }

    pub const PAYOUT_SCALE: u64 = 1_000_000;

    #[instruction]
    pub fn init_m8() -> Enc<Mxe, MarketPrivateState> {
        Mxe::get().from_arcis(MarketPrivateState {
            total_pool: 0,
            outcome_0_pool: 0,
            outcome_1_pool: 0,
            outcome_2_pool: 0,
            outcome_3_pool: 0,
            bet_count: 0,
        })
    }

    #[instruction]
    pub fn place_bet(
        bet_ctxt: Enc<Shared, BetInput>,
        outcome_count: u8,
        max_stake: u64,
        state_ctxt: Enc<Mxe, MarketPrivateState>,
    ) -> (Enc<Mxe, MarketPrivateState>, bool, u64, u64, u64, u64, u64) {
        let bet = bet_ctxt.to_arcis();
        let mut state = state_ctxt.to_arcis();
        let outcome_ok = bet.outcome < outcome_count && bet.outcome < 4;
        let amount_ok = bet.amount > 0 && bet.amount <= max_stake;
        let accepted = outcome_ok && amount_ok;

        if accepted {
            state.total_pool += bet.amount;
            state.bet_count += 1;

            if bet.outcome == 0 {
                state.outcome_0_pool += bet.amount;
            } else if bet.outcome == 1 {
                state.outcome_1_pool += bet.amount;
            } else if bet.outcome == 2 {
                state.outcome_2_pool += bet.amount;
            } else {
                state.outcome_3_pool += bet.amount;
            }
        }

        let total_pool = state.total_pool.reveal();
        let o0 = state.outcome_0_pool.reveal();
        let o1 = state.outcome_1_pool.reveal();
        let o2 = state.outcome_2_pool.reveal();
        let o3 = state.outcome_3_pool.reveal();

        (
            state_ctxt.owner.from_arcis(state),
            accepted.reveal(),
            total_pool,
            o0,
            o1,
            o2,
            o3,
        )
    }

    #[instruction]
    pub fn resolve_prediction_market(
        state_ctxt: Enc<Mxe, MarketPrivateState>,
        winning_outcome: u8,
    ) -> (u8, u64, u64, u64, bool) {
        let state = state_ctxt.to_arcis();
        let winning_pool = pool_for_outcome(&state, winning_outcome);
        let payout_ratio = payout_ratio(state.total_pool, winning_pool);

        (
            winning_outcome.reveal(),
            state.total_pool.reveal(),
            winning_pool.reveal(),
            payout_ratio.reveal(),
            true.reveal(),
        )
    }

    #[instruction]
    pub fn resolve_opinion_market(
        state_ctxt: Enc<Mxe, MarketPrivateState>,
        quorum: u32,
    ) -> (u8, u64, u64, u64, bool) {
        let state = state_ctxt.to_arcis();
        let quorum_met = state.bet_count >= quorum as u64;
        let mut winning_outcome = 0u8;
        let mut winning_pool = state.outcome_0_pool;

        if state.outcome_1_pool > winning_pool {
            winning_outcome = 1;
            winning_pool = state.outcome_1_pool;
        }
        if state.outcome_2_pool > winning_pool {
            winning_outcome = 2;
            winning_pool = state.outcome_2_pool;
        }
        if state.outcome_3_pool > winning_pool {
            winning_outcome = 3;
            winning_pool = state.outcome_3_pool;
        }

        if !quorum_met {
            winning_pool = 0;
        }

        let payout_ratio = payout_ratio(state.total_pool, winning_pool);

        (
            winning_outcome.reveal(),
            state.total_pool.reveal(),
            winning_pool.reveal(),
            payout_ratio.reveal(),
            quorum_met.reveal(),
        )
    }

    fn pool_for_outcome(state: &MarketPrivateState, outcome: u8) -> u64 {
        if outcome == 0 {
            state.outcome_0_pool
        } else if outcome == 1 {
            state.outcome_1_pool
        } else if outcome == 2 {
            state.outcome_2_pool
        } else {
            state.outcome_3_pool
        }
    }

    fn payout_ratio(total_pool: u64, winning_pool: u64) -> u64 {
        if winning_pool > 0 {
            (((total_pool as u128) * (PAYOUT_SCALE as u128)) / (winning_pool as u128)) as u64
        } else {
            PAYOUT_SCALE
        }
    }
}
