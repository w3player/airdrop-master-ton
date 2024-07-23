import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./helper.fc";
import "./messages.tact";
import "./utils.tact";
struct AirdropSettings {
    startTime: Int as uint32;
    endTime: Int as uint32;
    merkleRoot: Int as uint256;
    tokenWalletAddress: Address? = null;
}
struct ClaimEntry {
    index: Int as uint8;
    address: Address;
    claimableAmount: Int as uint128;
    claimableTimestamp: Int as uint32;
}

@name(merkle_verify)
native merkle_verify(proof_cell: Cell, merkle_root: Int, index: Int): Slice;

contract AirdropMaster with Deployable, OwnableTransferable, Stoppable, Resumable, AidropUtils {
    const MinTonForStorage: Int = ton("0.01"); // enough for 1 KB of storage for 2.5 years

    owner: Address;
    stopped: Bool = true; // The Stoppable trait requires you to add this exact state variable
    version: String = "1.0.0";
    // Biz var
    airdropSettings: AirdropSettings;
    claimed: map<Int, Bool>; // claimed map
    // Init contract
    init(){
        self.owner = sender();
        // init biz vars
        self.airdropSettings = AirdropSettings{startTime: 0, endTime: 0, merkleRoot: 0, tokenWalletAddress: null};
    }

    fun onlyOwner() {
        // likes requireOwner
        require(sender() == self.owner, "Only the owner is permitted here");
    }

    fun onlyInActive() {
        let now: Int = now();
        let isActive: Bool =
            !(self.stopped) && now > self.airdropSettings.startTime && now < self.airdropSettings.endTime;
        require(isActive, "Contract is not active");
    }

    get fun version(): String {
        return self.version;
    }

    get fun airdropSettings(): AirdropSettings {
        return self.airdropSettings;
    }

    get fun balance(): Int {
        return myBalance();
    }

    get fun balanceString(): String {
        return myBalance().toCoinsString();
    }

    get fun claimed(index: Int): Bool {
        return self.claimed.get(index) == true;
    }

    get fun checkProof(cell_proof: Cell, index: Int): ClaimEntry {
        let entry: Slice = merkle_verify(cell_proof, self.airdropSettings.merkleRoot, index);
        let index2: Int = entry.loadUint(8);
        let address2: Address = entry.loadAddress();
        let claimableAmount: Int = entry.loadCoins();
        let claimableTimestamp: Int = entry.loadUint(32);
        return
            ClaimEntry{
                index: index2,
                address: address2,
                claimableAmount: claimableAmount,
                claimableTimestamp: claimableTimestamp
            };
    }

    // receive(msg: ChangeOwner) is added automatically to transfer ownership
    // get fun owner(): Address is added automatically to query who the owner is

    // receive("Resume") is added automatically to allow owner to resume the contract
    // receive("Stop") is added automatically to allow owner to stop the contract
    // get fun stopped(): Bool is added automatically to query if contract is stopped
    // get fun owner(): Address is added automatically to query who the owner is

    receive(msg: SetBaseParams){
        self.requireOwner();
        self.airdropSettings = msg.args;
        self.notify("SetBaseParams".asComment());
    }

    receive(msg: Claim){
        self.onlyInActive();
        // check if already claimed
        if (self.claimed.get(msg.index) == true) {
            self.notify("Already claimed".asComment());
            return ;
        }
        let entry: Slice = merkle_verify(msg.proof, self.airdropSettings.merkleRoot, msg.index);
        let claimIdx: Int = entry.loadUint(8);
        require(claimIdx == msg.index, "Invalid claim index");
        let walletAddress: Address = entry.loadAddress();
        require(walletAddress == sender(), "Invalid claim");
        let claimableAmount: Int = entry.loadCoins();
        require(claimableAmount > 0, "Invalid claim amount");
        let claimableTimestamp: Int = entry.loadUint(32);
        require(now() > claimableTimestamp, "Invalid claim amount");
        // send jetton
        self.claimed.set(msg.index, true);
        self.sendJetton(msg.queryId,
            self.airdropSettings.tokenWalletAddress!!,
            walletAddress,
            claimableAmount,
            sender(),
            "claim"
        );
    }

    //   withdraw TON
    receive("withdraw"){
        self.requireOwner();
        let params: SendParameters = SendParameters{
            to: sender(),
            bounce: true,
            value: 0,
            mode: (SendRemainingBalance + SendIgnoreErrors)
        };
        send(params);
    }

    receive(msg: WithdrawToken){
        self.requireOwner();
        self.sendJetton(msg.queryId,
            self.airdropSettings.tokenWalletAddress!!,
            sender(),
            msg.amount,
            sender(),
            "withdraw"
        );
    }

    receive(){
        let ctx: Context = context();
        // https://docs.tact-lang.org/ref/core-advanced#nativereserve
        nativeReserve(ctx.value, ReserveAllExcept);
    }
}
message SetBaseParams {
    args: AirdropSettings;
}
message Claim {
    queryId: Int as uint64;
    proof: Cell;
    index: Int;
}
message WithdrawToken {
    queryId: Int as uint64;
    amount: Int as coins;
}