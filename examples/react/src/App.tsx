import React from "react";
import "./App.css";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import AuthLogin from "./AuthLogin";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <BrowserRouter>
          <Switch>
            <Route exact path="/auth/callback" component={AuthCallback} />
            <Route exact path="/auth/login" component={AuthLogin} />
            <Route path="*">
              <Link to="/auth/login">Login</Link>
            </Route>
          </Switch>
        </BrowserRouter>
      </header>
    </div>
  );
}

export default App;
