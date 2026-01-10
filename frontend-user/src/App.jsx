import { AuthProvider } from './context/AuthContext';
import ChatPage from './pages/ChatPage';

const App = () => {
  return (
    <AuthProvider>
      <ChatPage />
    </AuthProvider>
  );
};

export default App;