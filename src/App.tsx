import { useState, useEffect } from 'react';
import logo from './logo.svg';
import BigNumber from 'bignumber.js';
import TronWeb from "tronweb";
import { gql, useApolloClient } from '@apollo/client'
import './App.css';
const ESTIMATE_ENERGY = gql`
mutation estimateEnergy($amountTrx: Float!, $days: Int!) {
    tron_power_estimate_frozen_energy(amountTrx: $amountTrx, days: $days) {
      energy
      discount
      payTrx
      burnedTrx
    }
  }
`

const ESTIMATE_BANDWIDTH = gql`
mutation estimateBandwidth($amountTrx: Float!, $days: Int!) {
    tron_power_estimate_frozen_bandwidth(amountTrx: $amountTrx, days: $days) {
      bandwidth
      discount
      payTrx
      burnedTrx
    }
  }
`
const App = () => {
  const client = useApolloClient()
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
      } finally {
        setLoading(false)
      }
    }
  }

  const [rentData, setRentData] = useState({
    duration: '3',
    receiver: '',
    type: 'energy',
    amount: '',
    ref: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    loop: 1,
    loading: false,
    payTrx: 0,
  })
  const estimating = (amount: string, duration: string, type: string) => {
    try {
      client.mutate({
        mutation: type === "energy" ? ESTIMATE_ENERGY : ESTIMATE_BANDWIDTH,
        variables: {
          amountTrx: +new BigNumber(amount).multipliedBy(1e6),
          days: +duration
        }
      }).then(({ data }) => {
        if (type === 'energy') {
          const { payTrx } = data.tron_power_estimate_frozen_energy
          setRentData({ ...rentData, payTrx })
        }
        else {
          const { payTrx } = data.tron_power_estimate_frozen_bandwidth
          setRentData({ ...rentData, payTrx })
        }
      }, (error) => {
        console.log('ESTIMATE error', error)
      })
    } catch (error) {
      console.log('ESTIMATE ECEPTIONAL error', error)
    }
  }
  useEffect(() => {
    if ((+rentData.duration >= 3) && (+rentData.duration <= 30)) {
      let calculating = setTimeout(() => {
        estimating(rentData.amount, rentData.duration, rentData.type)
      }, 500);
      return () => {
        clearTimeout(calculating)
      }
    }
    else {
      setRentData({ ...rentData, payTrx: 0 })
    }
  }, [rentData.amount, rentData.duration, rentData.type])

  const handleRent = async (duration: number, add: string, type: string, amount: number, ref: string, loop: number) => {
    // console.log('amount', amount)
    for (let i = 0; i < loop; i++) {
      try {
        const memo = `rent-${duration}-${add}-${type === 'energy' ? 1 : 0}-${ref}`
        // const hex = tronWeb.toHex(memo)
        // const resultData = decodeTransactionData(address, hex)
        // console.log('Variable before Send', "\n HEX : " + hex, "\n MEMO :" + memo, "\n DecodeTransactionData :" + JSON.stringify(resultData))
        const unSignedTxn = await (window as any).tronWeb.transactionBuilder.sendTrx('TEx6CXgEY1XrGd5FJFrh9V6faYVgvPbmg6', amount);
        const unSignedTxnWithNote = await (window as any).tronWeb.transactionBuilder.addUpdateData(unSignedTxn, memo, 'utf8');
        const signedTxn = await (window as any).tronWeb.trx.sign(unSignedTxnWithNote);
        const result = await (window as any).tronWeb.trx.sendRawTransaction(signedTxn);
        if (result) {
          console.log(`Mượn lần ${i} thành công! ${i > 99 ? 'Mượn hơi lắm rồi đấy, có trả ko vậy?' : ''}`)
        }
      } catch (error) {
        setLoading(false)
        console.log('%c Ko cho mượn, lỗi lòi ra', 'background: #222; color: #bada55', error)
      } finally {
        setLoading(false)
      }
    }
  }
  const waitTron = () => {
    return new Promise((res) => {
      let attempts = 0,
        maxAttempts = 20;
      const checkTron = () => {
        if (
          (window as any).tronWeb &&
          (window as any).tronWeb.defaultAddress.base58
        ) {
          res(true);
          return;
        }
        attempts++;
        if (attempts >= maxAttempts) {
          res(false);
          return;
        }
        setTimeout(checkTron, 100);
      };
      checkTron();
    });
  };
  const initAction = async () => {
    let tronExist = await waitTron();
    if (tronExist) {
      setRentData({ ...rentData, receiver: (window as any).tronWeb.defaultAddress.base58 })
    }
  };
  useEffect(() => {
    initAction()
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="action">
          <div className="left">
            <div>
              <label htmlFor="privateKey">Private key của cưng là gì?</label>
              <input value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} id="privateKey" />
            </div>
            <div>
              <label htmlFor="amount">Hiến bao lít máu?</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} id="amount" />
            </div>
            <div>
              <label htmlFor="looping">Hiến bao lần nà?</label>
              <input value={loop} onChange={(e) => setLoop(+e.target.value)} id="looping" type="number" />
            </div>
            <div>
              <label htmlFor="contract">Người nhận máu?</label>
              <input value={contract} onChange={(e) => setContract(e.target.value)} id="contract" />
            </div>
            <button onClick={() => !loading && handleInvest(+amount, privateKey, loop)}>Hiến!</button>
          </div>
          <div className="right">
            <div>
              <label htmlFor="receiver">Cưng mượn cho đứa nào?</label>
              <input value={rentData.receiver} onChange={(e) => setRentData({ ...rentData, receiver: e.target.value })} id="receiver" />
            </div>
            <div>
              <label htmlFor="duration">Mượn cái gì? Ở đây chúng tôi ko dùng tiền...</label>
              <select id="type" name="type" onChange={(e) => setRentData({ ...rentData, type: e.target.value })}>
                <option value="energy">Energy</option>
                <option value="bandwidth">Bandwidth</option>
              </select>
            </div>
            <div>
              <label htmlFor="amountRent">Thế chấp nhiu TRX?</label>
              <input value={rentData.amount} onChange={(e) => setRentData({ ...rentData, amount: e.target.value })} id="amountRent" />
            </div>
            <div>
              <label htmlFor="duration">Mượn bao lâu? Lâu quá tính lãi nhé</label>
              <input value={rentData.duration} onChange={(e) => setRentData({ ...rentData, duration: e.target.value })} id="duration" />
            </div>
            <div>
              <label htmlFor="loopRent">Lặp lại bao lần?</label>
              <input value={rentData.loop} onChange={(e) => setRentData({ ...rentData, loop: +e.target.value })} id="loopRent" />
            </div>
            <div>
              <label htmlFor="ref">Ref? Ko biết thì đừng có mó máy....</label>
              <input value={rentData.ref} onChange={(e) => setRentData({ ...rentData, ref: e.target.value })} id="ref" />
            </div>
            <div>
              <span>Total payment: {+new BigNumber(rentData.payTrx).dividedBy(1e6)} TRX</span>
            </div>
            <button onClick={() => !rentData.loading && handleRent(
              +rentData.duration,
              rentData.receiver !== '' ? rentData.receiver : (window as any).tronWeb.defaultAddress.base58,
              rentData.type,
              rentData.payTrx,
              rentData.ref,
              rentData.loop
            )}>Mượn tý nào!</button>
          </div>
        </div>

      </header>
    </div >
  );
}

export default App;
