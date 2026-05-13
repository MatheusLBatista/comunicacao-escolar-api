import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { initSocketIO } from './src/config/SocketIO.js';

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

const httpServer = createServer(app);

initSocketIO(httpServer);

httpServer.listen(port, host, () => {
  console.log(
    `Servidor escutando em http://localhost:${port}, (Host: ${host})`,
  );
});
