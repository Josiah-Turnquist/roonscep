// Colyseus bootstrap. Runs locally for dev; the same entry deploys to Fly.io
// (auto-stop/auto-start) in production.
import colyseus from 'colyseus';
const { Server } = colyseus;
import { RoonscepRoom } from './RoonscepRoom.ts';

const port = Number(process.env.PORT) || 2567;

const gameServer = new Server();
gameServer.define('roonscep', RoonscepRoom);

gameServer.listen(port).then(() => {
  console.log(`⚔️  Roonscep server listening on ws://localhost:${port}`);
});
