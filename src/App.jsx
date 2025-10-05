import { useState,useCallback, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [length, setLength] = useState(8)
  const [numallow, setNumallow]=useState(false)
  const [challow, setchAllow] = useState(false)
  const [password, setPassword] = useState("")

  const passwordRef = useRef(null)

  const passwordGenerator = useCallback(()=>{
    let pass=""
    let str="QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm"

    if(numallow) str += "1234567890"
    if(challow) str += "_@!#$%^&*?/:|+-"

    for (let i = 1; i <= length; i++) {
      let charid = Math.floor(Math.random() * str.length + 1)
      pass += str.charAt(charid)
      
    }
    setPassword(pass)
  } , [length, numallow, challow, setPassword])

  useEffect(()=>{
    passwordGenerator()
  },[length,numallow,challow,passwordGenerator])

  const copypasswordtoclip = useCallback(()=>{
    passwordRef.current?.select();
    //passwordRef.current?.setSelectionRange(0,5);
    window.navigator.clipboard.writeText(password)
  },[password])

  return (
    <>
      <h1 >Password Generator</h1>
      <div className='w-full max-w-md rounded-lg mx-auto  px-4 my-8 text-orange-500 bg-gray-600 text-center'>
      <div className='flex outline-hidden '>
        <input type="text"
        value={password} 
        placeholder="Password"
        className='px-3 w-full outline-none mx-auto max-w-md rounded-lg my-4'
        ref={passwordRef}
        readOnly/>
        <button className='text-white bg-orange-500 h-md px-3 py-3 my-4 rounded-lg '
        onClick={copypasswordtoclip}>Copy</button>
      </div>
      <div className='flex text-sm gap-x-2'>
        <div className='flex items-center gap-x-1'>
          <input type="range" 
          min={4}
          max={25}
          value = {length}
          className='cursor-pointer' 
          onChange={(e)=>{setLength(e.target.value)}}/>
          <label>Length: {length}</label>
        </div>
        <div className='flex items-center gap-x-1'>
          <input type="checkbox"
          defaultChecked={numallow}
          id="numberinput"
          onChange={()=>{
            setNumallow((prev)=> !prev);
          }} />
          <label htmlFor="numberinput">Numbers</label>
        </div>

        <div className='flex items-center gap-x-1'>
          <input type="checkbox"
          defaultChecked={challow}
          id="charinput"
          onChange={()=>{
            setchAllow((prev)=> !prev);
          }} />
          <label htmlFor="charinput">Characters</label>
        </div>
      </div>
      </div>
      
    </>
  )
}

export default App
