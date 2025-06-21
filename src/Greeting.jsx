import { useState, useEffect } from 'react'

function Greeting() {
  const [text, setText] = useState('')
  const fullText = "Welcome to docChat AI! 📚"
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < fullText.length) {
      const timer = setTimeout(() => {
        setText((prev) => prev + fullText[index])
        setIndex((prev) => prev + 1)
      }, 100) // Adjust speed here (lower number = faster)

      return () => clearTimeout(timer)
    }
  }, [index])

  return (
    <span className="typewriter">
      {text}
      {index < fullText.length && '|'} {/* Blinking cursor effect */}
    </span>
  )
}

export default Greeting
