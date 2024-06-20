import { render } from 'solid-js/web';
import { Route, Router } from '@solidjs/router';

import './styles.css';

// Routes
import Login from './Routes/Login.tsx';
import DashBoard from './Routes/DashBoard.tsx';
import NotFound from './Routes/404.tsx';
import Diploma from './Routes/Diploma.tsx';

// Components
import Nav from './Components/Nav.tsx';
import Schedule from './Routes/Schedule.tsx';
import Settings from './Routes/Settings.tsx';
import DM from './Routes/DM.tsx';
import Assignment from './Routes/Assignments.tsx';

const App = (props) => {
  return (
    <>
      <Nav />
      {props.children}
    </>
  );
};

render(
  () => (
    <Router root={App}>
      <Route path={'/'} component={() => <DashBoard />} />
      <Route path={'/schedule'} component={() => <Schedule />} />
      <Route path={'/login'} component={() => <Login />} />
      <Route path={'/settings'} component={() => <Settings />} />
      <Route path={'/dm'} component={DM} />
      <Route path={'/assignment'} component={Assignment} />
      <Route path="/diploma" component={Diploma} />
      <Route path={'*404'} component={NotFound} />
    </Router>
  ),
  document.getElementById('root') as HTMLElement
);
