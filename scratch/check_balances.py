import subprocess
import json

address = "LqAZCTeYvx2BrvCBWkMCHqyKqg69t3TA3Y5UbhfixPT"

def get_signatures(limit=50):
    cmd = ["solana", "transaction-history", address, "--limit", str(limit)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip().split('\n')

def check_transaction(sig):
    cmd = ["solana", "confirm", "-v", sig]
    result = subprocess.run(cmd, capture_output=True, text=True)
    lines = result.stdout.split('\n')
    for line in lines:
        if "Account 0 balance:" in line:
            return line.strip()
    return None

sigs = get_signatures(100)
for sig in sigs:
    if len(sig) > 40:
        balance_info = check_transaction(sig)
        if balance_info and "->" in balance_info:
            parts = balance_info.split("->")
            b1 = float(parts[0].split("◎")[1].strip())
            b2 = float(parts[1].split("◎")[1].strip())
            if b2 > b1:
                print(f"BINGO! {sig}: {balance_info}")
            else:
                pass
