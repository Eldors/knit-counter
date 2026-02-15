import { HashRouter, Route } from '@solidjs/router';
import ProjectList from './pages/ProjectList';
import NewProject from './pages/NewProject';
import Project from './pages/Project';
import Counter from './pages/Counter';

export default function App() {
  return (
    <HashRouter>
      <Route path="/" component={ProjectList} />
      <Route path="/new" component={NewProject} />
      <Route path="/project/:id" component={Project} />
      <Route path="/project/:id/part/:partId" component={Counter} />
    </HashRouter>
  );
}
