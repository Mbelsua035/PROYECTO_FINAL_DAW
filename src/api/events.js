// MODO SSH
// const express = require('express');
// const mysql = require('mysql2/promise');
// const { Client } = require('ssh2');

// const routerEvents = express.Router();

// routerEvents.get('/events', async (req, res) => {
//   try {
//     const sshConnection = new Client();

//     const sshConfig = {
//       host: '10.1.1.42',
//       port: 22,
//       username: 'root',
//       password: '3studi@nta'
//     };

//     const dbConfig = {
//       host: 'localhost',
//       user: 'registrohorariouser',
//       password: '3studi@nta_db',
//       database: 'registrohorario',
//       port: 3306
//     };

//     sshConnection.on('ready', async () => {
//       try {
//         const stream = await new Promise((resolve, reject) => {
//           sshConnection.forwardOut(
//             'localhost',
//             12345,
//             'localhost',
//             3306,
//             (err, stream) => {
//               if (err) reject(err);
//               resolve(stream);
//             }
//           );
//         });

//         dbConfig.stream = stream;

//         const connection = await mysql.createConnection(dbConfig);
//             const [rows, fields] = await connection.execute(`
//                 SELECT id, label, state, type, nextState FROM Locations
//                 UNION
//                 SELECT 
//                     (SELECT MAX(id) FROM Locations) + id + 1 as id, 
//                     label, state, type, nextState 
//                 FROM _RegistrationsTypes
//                 WHERE label != 'Inicio Jornada'
//             `);

//         console.log('Filas de la base de datos:', rows);

//         await connection.end();
//         sshConnection.end();

//         res.json(rows);
//       } catch (error) {
//         console.error('Error al ejecutar SQL query:', error);
//         res.status(500).send('Error al ejecutar SQL query');
//       }
//     });

//     sshConnection.connect(sshConfig);
//   } catch (error) {
//     console.error('Error al conectar via SSH:', error);
//     res.status(500).send('Error al conectar via SSH');
//   }
// });

// module.exports = routerEvents;

// MODO LOCAL
const express = require('express');
const mysql = require('mysql2/promise');

const routerEvents = express.Router();

// Se crea un endpoint para obtener eventos.
routerEvents.get('/events', async (req, res) => {
    try {
        // Se configura la conexión a la base de datos.
        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '3studi@nta',
            database: 'registrohorario',
            port: 3306
        };

        // Se crea la conexión a la base de datos.
        const connection = await mysql.createConnection(dbConfig);

        // Se crea una consulta SQL para obtener eventos.
        const [rows, fields] = await connection.execute(`
            SELECT id, label, state, type, nextState FROM Locations
            UNION
            SELECT 
                (SELECT MAX(id) FROM Locations) + id + 1 as id, 
                label, state, type, nextState 
            FROM _RegistrationsTypes
            WHERE label != 'Inicio Jornada'
        `);


        console.log('Filas de la base de datos:', rows);

        // Una vez realizado, se cierra la conexión a la base de datos.
        await connection.end();

        // Se envia los resutados como respuesta.
        res.send(rows);
    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
});

module.exports = routerEvents;