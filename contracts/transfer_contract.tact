import "@stdlib/deploy";
import "@stdlib/ownable";

import "./messages.tact";
import "./utils.tact";

struct SendTarget {
    to: Address;
    amount: Int as uint128;
}

contract TransferContract with Deployable, OwnableTransferable, AidropUtils {

    const MinTonForStorage: Int = ton("0.01"); // enough for 1 KB of storage for 2.5 years
    
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
        self.reply(emptyCell());
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

    receive(msg: Send2){
        self.requireOwner();
        self.sendJetton(msg.queryId, self.jettonWalletAddress!!, msg.to, msg.amount, sender(), msg.message);
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

message Send2 {
    queryId: Int as uint64;
    to: Address;
    amount: Int as uint128;
    message: String;
}

