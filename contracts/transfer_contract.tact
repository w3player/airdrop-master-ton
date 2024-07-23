import "@stdlib/deploy";
import "@stdlib/ownable";

struct SendTarget {
    to: Address;
    amount: Int as uint128;
}

contract TransferContract with Deployable, OwnableTransferable, {
    owner: Address;
    jettonWalletAddress: Address?;

    init(){
        self.owner = sender();
    }

    get fun getJettonWalletAddress(): Address? {
        return self.jettonWalletAddress;
    }

    receive(msg: SetJettonWalletAddress){
        self.requireOwner();
        self.jettonWalletAddress = msg.jettonWalletAddress;
    }

    // send a single transfer
    receive(msg: Send){
        self.requireOwner();
        let payload: Slice = beginCell().
            storeUint(0, 32). // 0x0 - text comment
            storeUint(0, 1).  // 0x0 - text is stored in this cell
            storeSlice(msg.message.asSlice()).
            endCell().
            asSlice();

        let params = SendParameters{
            to: self.jettonWalletAddress!!,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TokenTransfer{
                queryId: msg.queryId,
                amount:msg.amount, 
                destination: msg.to,
                response_destination: sender(),
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: payload,
            }.toCell(),
        };
        send(params);
    }
}

message SetJettonWalletAddress {
    jettonWalletAddress: Address;
}

message Send {
    queryId: Int as uint64;
    to: Address;
    amount: Int as uint128;
    message: String;
}

message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}