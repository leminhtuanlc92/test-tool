import { useState } from 'react';
import logo from './logo.svg';
import BigNumber from 'bignumber.js';
import TronWeb from "tronweb";

import './App.css';

const App = () => {
  const [loading, setLoading] = useState(false)
  const [privateKey, setPrivateKey] = useState('')
  const [amount, setAmount] = useState('')
  const [contract, setContract] = useState('TEx6CXgEY1XrGd5FJFrh9V6faYVgvPbmg6')
  const [loop, setLoop] = useState(1)
  const handleInvest = async (amount: number, privateKey: string, loop: number) => {
    const tronWeb = new TronWeb({
      fullNode: 'https://api.nileex.io/',
      solidityNode: 'https://api.nileex.io/',
      eventServer: 'https://api.nileex.io/',
      privateKey: privateKey
    });
    console.log('LL', amount, privateKey, loop, contract)
    for (let i = 0; i < loop; i++) {
      try {
        const memo = `provide`
        const unSignedTxn = await tronWeb.transactionBuilder.sendTrx(
          contract,
          +new BigNumber(amount).multipliedBy(1e6)
        );
        console.log('Invest unSignedTxn', unSignedTxn)
        const unSignedTxnWithNote = await tronWeb.transactionBuilder.addUpdateData(unSignedTxn, memo, 'utf8');
        // console.log('Invest unSignedTxnWithNote', unSignedTxnWithNote)
        const signedTxn = await tronWeb.trx.sign(unSignedTxnWithNote, privateKey);
        // console.log('Invest signedTxn', signedTxn)
        const result = await tronWeb.trx.sendRawTransaction(signedTxn);
        console.log('result', result)
        if (result) {
          console.log(`Hiến máu lần ${i} thành công!`)
        }
      } catch (error) {
        setLoading(false)
        console.log('submit Invest power error', error)
      }
      finally {
        setLoading(false)
      }
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <label htmlFor="privateKey">Private key của cưng là gì?</label>
        <input value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} id="privateKey" />

        <label htmlFor="amount">Hiến bao lít máu?</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} id="amount" />

        <label htmlFor="looping">Hiến bao lần nà?</label>
        <input value={loop} onChange={(e) => setLoop(+e.target.value)} id="looping" type="number" />

        <label htmlFor="contract">Người nhận máu?</label>
        <input value={contract} onChange={(e) => setContract(e.target.value)} id="contract"/>

        <button onClick={() => !loading && handleInvest(+amount, privateKey, loop)}>Hiến!</button>
      </header>
    </div>
  );
}

export default App;
