import * as fcl from '@onflow/fcl'
import * as types from '@onflow/types'

fcl.config()
  .put('accessNode.api', process.env.REACT_APP_FLOW_ACCESS_NODE)
  .put('challenge.handshake', process.env.REACT_APP_FLOW_WALLET_DISCOVERY)
  .put('discovery.wallet', process.env.REACT_APP_FLOW_WALLET_DISOVERY)

function App() {
  const payWithFlow = async () => {
    try {
      await fcl.authenticate()
      const response = await fcl.send([
        fcl.transaction`import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken
transaction(amount: UFix64) {
    let sentVault: @FungibleToken.Vault
    prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }
    execute {
        let recipient = getAccount(0x7f9a6b61ba0de5ee)
        let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Could not borrow receiver reference to the recipient's Vault")
        receiverRef.deposit(from: <-self.sentVault)
    }
}`,
        fcl.args([
          fcl.arg(5, types.UFix64),
          // fcl.arg(address, types.Address),
        ]),
        fcl.proposer(fcl.currentUser().authorization),
        fcl.authorizations([fcl.currentUser().authorization]),
        fcl.payer(fcl.currentUser().authorization),
        fcl.limit(9999),
      ])
      await fcl.tx(response).onceSealed()
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="App">
      <button onClick={payWithFlow}>Send Flow to Eternal</button>
    </div>
  );
}

export default App;
