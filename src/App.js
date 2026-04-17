import Header from "./components/Header";
import SampleRegister from "./components/SampleRegister";

function App() {
  return (
    <div className="App">
      <Header title="Chemical Analysis Lab" />
      <main className="container main" style={{ "--mt": 10, "--mb": 10 }}>
        <SampleRegister />
      </main>
    </div>
  );
}

export default App;
