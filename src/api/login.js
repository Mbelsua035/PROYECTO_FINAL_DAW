// MODO SSH
// const express = require('express');
// const mysql = require('mysql2/promise');
// const { Client } = require('ssh2');

// const routerLogin = express.Router();

// const sshConfig = {
//   host: '10.1.1.42',
//   port: 22,
//   username: 'root',
//   password: '3studi@nta'
// };

// const dbConfig = {
//   host: 'localhost',
//   user: 'registrohorariouser',
//   password: '3studi@nta_db',
//   database: 'registrohorario',
//   port: 3306
// };

// const connectViaSSH = async () => {
//   const sshConnection = new Client();

//   return new Promise((resolve, reject) => {
//     sshConnection.on('ready', () => {
//       sshConnection.forwardOut(
//         'localhost',
//         12345,
//         'localhost',
//         3306,
//         (err, stream) => {
//           if (err) {
//             reject(err);
//           } else {
//             dbConfig.stream = stream;
//             resolve({ sshConnection, dbConfig });
//           }
//         }
//       );
//     }).connect(sshConfig);
//   });
// };

// routerLogin.post('/login', async (req, res) => {
//   try {
//     const { sshConnection, dbConfig } = await connectViaSSH();
//     const connection = await mysql.createConnection(dbConfig);

//     // Se obtiene email y contraseña del cuerpo de la solicitud POST.
//     const { email, password } = req.body;

//     // Consulta SQL para obtener el usuario con el email y la contraseña proporcionados.
//     const [rows, fields] = await connection.execute(`
//       SELECT firstName, lastName FROM Users WHERE email = ? AND password = ?
//     `, [email, password]);

//     if (rows.length > 0) {
//       // Si el usuario se ha encontrado, iniciar sesión.
//       const { firstName, lastName } = rows[0];
//       // Devuelve el nombre del usuario.
//       res.json({ success: true, firstName, lastName });
//     } else {
//       // Si el usuario no se ha encontrado o credenciales incorrectas.
//       res.status(401).json({ success: false, message: "Credenciales incorrectas" });
//     }

//     await connection.end();
//     sshConnection.end();
//   } catch (error) {
//     console.error('Error al ejecutar SQL query:', error);
//     res.status(500).send('Error al ejecutar SQL query');
//   }
// });

// routerLogin.post('/token', async (req, res) => {
//   try {
//     const { sshConnection, dbConfig } = await connectViaSSH();
//     const connection = await mysql.createConnection(dbConfig);

//     const { token, email } = req.body;

//     const [userRows, userFields] = await connection.execute(`
//       SELECT id FROM Users WHERE email = ?
//     `, [email]);

//     if (userRows.length > 0) {
//       const userId = userRows[0].id;

//       const [result] = await connection.execute(`
//           UPDATE Users SET token = ? WHERE id = ?
//       `, [token, userId]);

//       if (result.affectedRows > 0) {
//         res.json({ success: true, message: "Token guardado correctamente" });
//       } else {
//         res.status(500).json({ success: false, message: "Error al guardar el token" });
//       }
//     } else {
//       res.status(404).json({ success: false, message: "Usuario no encontrado" });
//     }

//     await connection.end();
//     sshConnection.end();
//   } catch (error) {
//     console.error('Error al ejecutar SQL query:', error);
//     res.status(500).send('Error al ejecutar SQL query');
//   }
// });

// routerLogin.post('/getUserByToken', async (req, res) => {
//   try {
//     const { sshConnection, dbConfig } = await connectViaSSH();
//     const connection = await mysql.createConnection(dbConfig);

//     const { token } = req.body;

//     // Se realiza la consulta en la base de datos para obtener los detalles del usuario asociados al token.
//     const [rows, fields] = await connection.execute(`
//         SELECT firstName, lastName, id FROM Users WHERE token = ?
//     `, [token]);

//     if (rows.length > 0) {
//       // Si el usuario se ha encontrado, devolver los detalles del usuario.
//       const { firstName, lastName, id } = rows[0];
//       res.json({ success: true, firstName, lastName, id });
//     } else {
//       // Si no se encontró ningún usuario con el token proporcionado nos saldrá un mensaje de error.
//       res.status(404).json({ success: false, message: "No se encontró ningún usuario con el token proporcionado" });
//     }

//     await connection.end();
//     sshConnection.end();
//   } catch (error) {
//     console.error('Error al recuperar el usuario por token:', error);
//     res.status(500).send('Error al recuperar el usuario por token');
//   }
// });

// module.exports = routerLogin;


// MODO LOCAL
const express = require('express');
const mysql = require('mysql2/promise');

const routerLogin = express.Router();

routerLogin.post('/login', async (req, res) => {
    try {
        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '3studi@nta',
            database: 'registrohorario',
            port: 3306
        };

        const connection = await mysql.createConnection(dbConfig);

        // Se obtiene email y contraseña del cuerpo de la solicitud POST.
        const { email, password } = req.body;

        // Consulta SQL para obtener el usuario con el email y la contraseña proporcionados.
        const [rows, fields] = await connection.execute(`
            SELECT firstName, lastName FROM Users WHERE email = ? AND password = ?
        `, [email, password]);

        if (rows.length > 0) {
            // Si el usuario se ha encontrado, iniciar sesión.
            const { firstName, lastName } = rows[0];
            // Devuelve el nombre del usuario.
            res.json({ success: true, firstName, lastName }); 
        } else {
            // Si el usuario no se ha encontrado o credenciales incorrectas.
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }

        await connection.end();
    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
},
routerLogin.post('/token', async (req, res) => {
      try {
        const dbConfig = {
          host: 'localhost',
          user: 'root',
          password: '3studi@nta',
          database: 'registrohorario',
          port: 3306
      };

      const connection = await mysql.createConnection(dbConfig);

      const { token, email } = req.body;

      const [userRows, userFields] = await connection.execute(`
          SELECT id FROM Users WHERE email = ?
      `, [email]);

      if (userRows.length > 0) {
          const userId = userRows[0].id;

          const [result] = await connection.execute(`
              UPDATE Users SET token = ? WHERE id = ?
          `, [token, userId]);

          if (result.affectedRows > 0) {
              res.json({ success: true, message: "Token guardado correctamente" });
          } else {
              res.status(500).json({ success: false, message: "Error al guardar el token" });
          }
      } else {
          res.status(404).json({ success: false, message: "Usuario no encontrado" });
      }

      await connection.end();
  } catch (error) {
      console.error('Error al ejecutar SQL query:', error);
      res.status(500).send('Error al ejecutar SQL query');
  }
}),
routerLogin.post('/getUserByToken', async (req, res) => {
  try {
      const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '3studi@nta',
        database: 'registrohorario',
        port: 3306
    };

    const connection = await mysql.createConnection(dbConfig);

    const { token } = req.body;

    // Se realiza la consulta en la base de datos para obtener los detalles del usuario asociados al token.
    const [rows, fields] = await connection.execute(`
      SELECT firstName, lastName, id FROM Users WHERE token = ?
    `, [token]);

    if (rows.length > 0) {
      // Si el usuario se ha encontrado, devolver los detalles del usuario.
      const { firstName, lastName} = rows[0];
      const { id } = rows[0];
      res.json({ success: true, firstName, lastName, id });
    } else {
      // Si no se encontró ningún usuario con el token proporcionado nos saldrá un mensaje de error.
      res.status(404).json({ success: false, message: "No se encontró ningún usuario con el token proporcionado" });
    }
  } catch (error) {
    console.error('Error al recuperar el usuario por token:', error);
    res.status(500).send('Error al recuperar el usuario por token');
  }
}),
);

module.exports = routerLogin;