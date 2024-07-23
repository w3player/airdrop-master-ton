import "./messages.tact";

trait AidropUtils {
    fun sendJetton(queryId: Int, jettonWalletAddress: Address, to: Address, amount: Int, responseDest: Address, message: String) {
        let payload: Slice = beginCell().
            storeUint(0, 32). // 0x0 - text comment
            storeUint(0, 1).  // 0x0 - text is stored in this cell
            storeSlice(message.asSlice()).
            endCell().
            asSlice();

        let params = SendParameters{
            to: jettonWalletAddress,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TokenTransfer{
                queryId: queryId,
                amount: amount, 
                destination: to,
                response_destination: responseDest,
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: payload,
            }.toCell(),
        };
        send(params);
    }
}