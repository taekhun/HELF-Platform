import React, { Component } from "react";
import "./CSS/App.css";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import VideoScreen from "./screens/VideoScreen";
import Store from "./Store/store";
import { BrowserRouter, Route, Link, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import withLogin from "./Components/LoginHOC"; // 로그인 했을 때만 보여짐
import roomListScreen from "./screens/RoomListScreen";
import roomMakeScreen from "./screens/RoomMakeScreen";
// function App() {
//   return (
//     <LoginScreen/>
//   );
// }

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logged: false,
      onLogin: this.onLogin,
      onLogout: this.onLogout,
    };
  }

  // Login Func
  onLogin = () => {
    this.setState({
      logged: true,
    });
  };

  // Logout Func
  onLogout = () => {
    this.setState({
      logged: false,
    });
    const provider = window.sessionStorage.getItem("provider");
    //Google AccessToken Remove
    if (provider === "google") {
    }
  };
  componentDidMount() {
    //컴포넌트가 만들어지고 render가 호출 된 후 호출되는 메소드
    const id = window.sessionStorage.getItem("id");
    if (id) {
      this.onLogin();
    } else {
      this.onLogout();
    }
  }
  render() {
    const { logged, onLogout } = this.state;

    return (
      <Store.Provider value={this.state}>
        <BrowserRouter>
          <Switch>
            <Route exact path='/' component={LoginScreen} />
            <Route path='/video' component={CreateRoom} />
            <Route path='/room/:roomID' component={Room} />
            <Route path='/home' component={HomeScreen} />
            <Route path='/roomList' component={roomListScreen} />
            <Route path='/roomMake' component={roomMakeScreen} />
          </Switch>
        </BrowserRouter>
      </Store.Provider>
    );
  }
}
export default App;
