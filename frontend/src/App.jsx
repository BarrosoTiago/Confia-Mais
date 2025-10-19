import { useState, useEffect } from 'react'
import axios from 'axios' // Importe o Axios
import './App.css'

function App() {
  // Estado para guardar os dados da API
  const [dados, setDados] = useState([])
  const [erro, setErro] = useState(null)

  // URL da sua API Django
  // IMPORTANTE: Use o endpoint de teste que você criou.
  const API_URL = 'http://127.0.0.1:8000/api/tarefas/'

  // useEffect é executado quando o componente é montado
  useEffect(() => {
    // Função para buscar os dados
    const buscarDados = () => {
      axios.get(API_URL)
        .then(response => {
          // Se der certo, atualiza o estado com os dados
          setDados(response.data)
          console.log(response.data)
        })
        .catch(error => {
          // Se der errado, guarda a mensagem de erro
          console.error("Houve um erro ao buscar os dados:", error)
          setErro("Não foi possível carregar os dados. O backend está rodando?")
        })
    }

    buscarDados()
  }, []) // O array vazio [] faz com que isso rode apenas uma vez

  return (
    <>
      <h1>Conexão React ⇔ Django</h1>
      <h2>Testando a API em: {API_URL}</h2>

      {/* Mostra uma mensagem de erro se houver */}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {/* Mostra os dados se eles existirem */}
      <h3>Dados Recebidos:</h3>
      {dados.length > 0 ? (
        <ul>
          {dados.map(item => (
            <li key={item.id}>{item.titulo}</li> // Assumindo que tem 'id' e 'titulo'
          ))}
        </ul>
      ) : (
        <p>Nenhum dado encontrado (ou carregando...).</p>
      )}
    </>
  )
}

export default App