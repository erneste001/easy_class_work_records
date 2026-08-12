import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcoming from "./Home";
import Teacher from "./Teacher";
import Students from "./Student";
import A from "./A";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Welcoming />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/students" element={<Students />} />
        <Route path="/register" element={<A />} />
      </Routes>
    </BrowserRouter>
    
  );

}

export default App;