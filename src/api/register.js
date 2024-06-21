// MODO SSH
// const express = require('express');
// const routerRegister = express.Router();
// const { DateTime } = require('luxon');
// const mysql = require('mysql2/promise');
// const { Client } = require('ssh2');
// const strftime = require('strftime');

// const sshConnection = new Client();

// const sshConfig = {
//     host: '10.1.1.42',
//     port: 22,
//     username: 'root',
//     password: '3studi@nta'
// };

// const dbConfig = {
//     host: 'localhost',
//     user: 'registrohorariouser',
//     password: '3studi@nta_db',
//     database: 'registrohorario',
//     port: 3306
// };

// // Endpoint para obtener registros de jornada.
// routerRegister.post('/records', async (req, res) => {
//     try {
//         sshConnection.on('ready', async () => {
//             try {
//                 const stream = await new Promise((resolve, reject) => {
//                     sshConnection.forwardOut(
//                         'localhost',
//                         12345,
//                         'localhost',
//                         3306,
//                         (err, stream) => {
//                             if (err) reject(err);
//                             resolve(stream);
//                         }
//                     );
//                 });

//                 dbConfig.stream = stream;

//                 // Se crea conexión a la base de datos.
//         const connection = await mysql.createConnection(dbConfig);

//         // Se crea una consulta SQL para obtener registros de jornada.
//         const [rows, fields] = await connection.execute(`
//             SELECT ur.id AS userID, u.date, t.name AS typeName, l.label AS locationLabel, ur.id AS userIdFromUserRegistration
//             FROM UsersRegistrationLocations u
//             JOIN _RegistrationsTypes t ON u.idtypes = t.id
//             JOIN Locations l ON u.idlocations = l.id
//             JOIN Users ur ON u.iduser = ur.id
//             WHERE u.state = 'activo'
//         `);

//         // Se le da formato a los registros.
//         const formattedRecords = rows.map(row => ({
//             userID: row.userID,
//             date: strftime('%F %T', new Date(row.date)),
//             type: {
//                 ID: row.typeID,
//                 name: row.typeName,
//                 location: row.locationLabel
//             }
//         }));

//         // Se cerra la conexión a la base de datos.
//                 await connection.end();
//                 sshConnection.end();

//                 const response = {
//                     nextLink: "",
//                     prevLink: "",
//                     Records: formattedRecords
//                 };

//                 console.log(JSON.stringify(response, null, 2));
//                 res.json(response);

//             } catch (error) {
//                 console.error('Error al ejecutar SQL query:', error);
//                 res.status(500).send('Error al ejecutar SQL query');
//             }
//         });

//         sshConnection.connect(sshConfig);
//     } catch (error) {
//         console.error('Error al conectar via SSH:', error);
//         res.status(500).send('Error al conectar via SSH');
//     }
// });

// /*
// {
//     "startDate": "2024-04-18",
//     "endDate": "2024-04-18",
//     "iduser": "1",
//     "idtype": "3",
//     "idlocations": "3",
//     "idrecords": "1"
// }
// */

// // Endpoint para crear nuevos registros de jornada.
// routerRegister.put('/records', async (req, res) => {
//     try {
//         // Se extraen datos del cuerpo de la solicitud.
//         const { startDate, endDate, iduser, idtype, idlocations } = req.body;

//         console.log("idtype", idtype)

//         // Se verifica si se proporcionaron todos los parámetros necesarios.
//         if (!startDate ) {
//             return res.status(400).send('Parámetros requeridos faltantes en startDate');
//         }

//         if (!endDate) {
//             return res.status(400).send('Parámetros requeridos faltantes en endDate');
//         }

//         if (!iduser && iduser != 0 ) {
//             return res.status(400).send('Parámetros requeridos faltantes en iduser');
//         }

//         if ( !idtype && idtype != 0 ) {
//             return res.status(400).send('Parámetros requeridos faltantes en idtype');
//         }

//         if (!idlocations && idlocations != 0) {
//             return res.status(400).send('Parámetros requeridos faltantes en idlocations');
//         }

//         sshConnection.on('ready', async () => {
//             try {
//                 const stream = await new Promise((resolve, reject) => {
//                     sshConnection.forwardOut(
//                         'localhost',
//                         12345,
//                         'localhost',
//                         3306,
//                         (err, stream) => {
//                             if (err) reject(err);
//                             resolve(stream);
//                         }
//                     );
//                 });

//                 dbConfig.stream = stream;

//                 const connection = await mysql.createConnection(dbConfig);

//         // Se inserta un nuevo registro en la tabla Records.
//         const [insertRecordResult] = await connection.execute(`
//             INSERT INTO Records (iduser, startDate, endDate)
//             VALUES (?, ?, ?)
//         `, [iduser, startDate, endDate]);

//         // Se verifica si se insertó correctamente el nuevo registro.
//         if (insertRecordResult.affectedRows === 0) {
//             await connection.end();
//             return res.status(500).send('Error inserting new record into Records table');
//         }

//         // Se obtienen y verifican si se encontraron los IDs necesarios.
//         const recordId = insertRecordResult.insertId;

//         // Se inserta un nuevo registro en la tabla UsersRegistrationLocations.
//         const dateJs = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
//         const [insertResult] = await connection.execute(`
//             INSERT INTO UsersRegistrationLocations (iduser, idtypes, idlocations, date, idrecords, state)
//             VALUES (?, ?, ?, ?, ?, 'activo')
//         `, [iduser, idlocations, idlocations, dateJs, recordId]);

//         // Se verifica si se insertó correctamente el nuevo registro.
//         if (insertResult.affectedRows === 0) {
//             await connection.end();
//             return res.status(500).send('Error inserting new record');
//         }

//         // Se obtiene el último registro de jornada para enviar como respuesta.
//         const [rows, fields] = await connection.execute(`
//             SELECT r.startDate, u_rl.date, r.endDate, r.iduser, u.name AS name, u.id AS userID, t.id AS typeID, t.name AS typeName, l.label AS locationLabel
//             FROM UsersRegistrationLocations u_rl
//             JOIN Records r ON u_rl.idrecords = r.id
//             JOIN Users u ON r.iduser = u.id
//             JOIN _RegistrationsTypes t ON u_rl.idtypes = t.id
//             JOIN Locations l ON u_rl.idlocations = l.id
//             ORDER BY r.id DESC
//             LIMIT 1
//         `);

//         // Se cierra la conexión a la base de datos.
//                 await connection.end();

//                 // Se formatea el registro.
//                 const formattedRecords2 = rows.map(row => ({
//                     user: {
//                         ID: row.userID,
//                         name: row.name
//                     },
//                     date: strftime('%F %T', new Date(row.date)),
//                     type: {
//                         ID: row.typeID,
//                         name: row.typeName,
//                         location: row.locationLabel
//                     }
//                 }));

//                 const request = {
//                     startDate: startDate,
//                     endDate: endDate,
//                     user: iduser,
//                 };

//                 const response = {
//                     request,
//                     result: {
//                         nextLink: "",
//                         prevLink: "",
//                         Records: formattedRecords2
//                     }
//                 };

//                 console.log(JSON.stringify(response, null, 2));
//                 res.json(response);

//             } catch (error) {
//                 console.error('Error al ejecutar SQL query:', error);
//                 res.status(500).send('Error al ejecutar SQL query');
//             }
//         });

//         sshConnection.connect(sshConfig);
//     } catch (error) {
//         console.error('Error al conectar via SSH:', error);
//         res.status(500).send('Error al conectar via SSH');
//     }
// });

// /*
// {
//     "date": "2024-04-19 12:33:00",
//     "idtype": "1",
//     "idlocations": "7"
// }     
// */

// // Endpoint para actualizar un registro de jornada.
// routerRegister.patch('/records/:iduser', async (req, res) => {
//     try {
//         const iduser = req.params.iduser;
//         const { date, idtype, idlocations } = req.body;

//         console.log(req.body)

//         const sshConnection = new Client();

//         sshConnection.on('ready', async () => {
//             try {
//                 const stream = await new Promise((resolve, reject) => {
//                     sshConnection.forwardOut(
//                         'localhost',
//                         12345,
//                         'localhost',
//                         3306,
//                         (err, stream) => {
//                             if (err) reject(err);
//                             resolve(stream);
//                         }
//                     );
//                 });

//                 dbConfig.stream = stream;

//                 const connection = await mysql.createConnection(dbConfig);

//         // Se obtiene el último registro activo del iduser.
//         const [lastRecordResult] = await connection.execute(`
//             SELECT id FROM UsersRegistrationLocations WHERE iduser = ? AND state = 'activo' ORDER BY id DESC LIMIT 1
//         `, [iduser]);

//         if (lastRecordResult.length === 0) {
//             res.status(404).send('No se encontró el registro activo a actualizar');
//             await connection.end();
//             return;
//         }

//         const lastRecordId = lastRecordResult[0].id;
        

//         // Se actualiza parcialmente el último registro activo del iduser.
//         const [updateResult] = await connection.execute(`
//             UPDATE UsersRegistrationLocations SET idtypes = ?, idlocations = ?, date = ? WHERE id = ?
//         `, [idtype, idlocations, date, lastRecordId]);

//         if (updateResult.affectedRows === 0) {
//             res.status(404).send('No se encontró el registro a actualizar');
//             await connection.end();
//             return;
//         }

//         // Se obtiene el registro actualizado.
//         const [rows] = await connection.execute(`
//             SELECT u.name AS userName, r.date, r.iduser, u.id AS userID, t.id AS typeID, t.name AS typeName, l.label AS locationLabel
//             FROM UsersRegistrationLocations r
//             JOIN Users u ON r.iduser = u.id
//             JOIN _RegistrationsTypes t ON r.idtypes = t.id
//             JOIN Locations l ON r.idlocations = l.id
//             WHERE r.id = ?
//         `, [lastRecordId]);

//         const updatedRecord = rows.map(row => ({
//             result: {
//                 user: {
//                     ID: row.userID,
//                     name: row.userName
//                 },
//                 date: new Date(row.date).toISOString().replace('T', ' ').substr(0, 19),  // Se usa el formato YYYY-MM-DD HH:MM:SS.
//                 type: {
//                     ID: row.typeID,
//                     name: row.typeName,
//                     location: row.locationLabel
//                 }
//             }
//         }));

//                 await connection.end();

//                 const response = {
//                     Record: updatedRecord
//                 };

//                 console.log(JSON.stringify(response, null, 2));
//                 res.send(response);

//             } catch (error) {
//                 console.error('Error al ejecutar SQL query:', error);
//                 res.status(500).send('Error al ejecutar SQL query');
//             } finally {
//                 sshConnection.end();
//             }
//         });

//         sshConnection.connect(sshConfig);
//     } catch (error) {
//         console.error('Error al conectar via SSH:', error);
//         res.status(500).send('Error al conectar via SSH');
//     }
// });

// routerRegister.patch('/records/Time/:iduser', async (req, res) => {
//     try {
//         const iduser = req.params.iduser;
//         const { newTime } = req.body;

//         const sshConnection = new Client();

//         sshConnection.on('ready', async () => {
//             try {
//                 const stream = await new Promise((resolve, reject) => {
//                     sshConnection.forwardOut(
//                         'localhost',
//                         12345,
//                         'localhost',
//                         3306,
//                         (err, stream) => {
//                             if (err) reject(err);
//                             resolve(stream);
//                         }
//                     );
//                 });

//                 dbConfig.stream = stream;

//                 const connection = await mysql.createConnection(dbConfig);

//                 const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
//                 if (!newTime || !timeRegex.test(newTime)) {
//                     res.status(400).send('El nuevo tiempo debe estar presente y tener el formato HH:mm:ss.');
//                     return;
//                 }

//                 const [updateResult] = await connection.execute(`
//                     UPDATE UsersRegistrationLocations
//                     SET totalTime = ?
//                     WHERE iduser = ? AND state = 'activo'
//                     ORDER BY id DESC
//                     LIMIT 1
//                 `, [newTime, iduser]);

//                 if (updateResult.affectedRows === 0) {
//                     res.status(404).send('No se encontró ningún registro de jornada activo para este usuario.');
//                     console.log('No se encontró ningún registro de jornada activo para este usuario.');
//                 } else {
//                     console.log('Se ha actualizado el tiempo del registro de jornada.');
//                     const response = {
//                         message: 'Se ha actualizado el tiempo del registro de jornada.'
//                     };
//                     res.send(response);
//                 }

//                 await connection.end();
//             } catch (error) {
//                 console.error('Error al ejecutar SQL query:', error);
//                 res.status(500).send('Error al ejecutar SQL query');
//             } finally {
//                 sshConnection.end();
//             }
//         });

//         sshConnection.connect(sshConfig);
//     } catch (error) {
//         console.error('Error al conectar via SSH:', error);
//         res.status(500).send('Error al conectar via SSH');
//     }
// });

// // Endpoint para eliminar un registro de jornada.
// routerRegister.delete('/records/:iduser', async (req, res) => {
//     try {
//         // Se obtiene la ID del usuario, luego se crea la conexión a la base de datos.
//         const iduser = req.params.iduser;

//         const sshConnection = new Client();

//         sshConnection.on('ready', async () => {
//             try {
//                 const stream = await new Promise((resolve, reject) => {
//                     sshConnection.forwardOut(
//                         'localhost',
//                         12345,
//                         'localhost',
//                         3306,
//                         (err, stream) => {
//                             if (err) reject(err);
//                             resolve(stream);
//                         }
//                     );
//                 });

//                 dbConfig.stream = stream;

//                 const connection = await mysql.createConnection(dbConfig);

//         // Se obtiene el último registro de jornada del usuario.
//         const [lastRecordResult] = await connection.execute(`
//             SELECT state FROM UsersRegistrationLocations
//             WHERE iduser = ?
//             ORDER BY id DESC
//             LIMIT 1
//         `, [iduser]);

//         if (lastRecordResult.length === 0) {
//             res.status(404).send('No se encontró ningún registro de jornada para este usuario.');
//             console.log('No se encontró ningún registro de jornada para este usuario.');
//             return;
//         }

//         const currentState = lastRecordResult[0]?.state;

//         // Se verifica el estado del último registro de jornada.
//         if (currentState === 'activo') {
//             console.log('El registro de jornada estaba activo. Actualizando a finalizado...');
//             // Se actualiza el estado del registro a 'finalizado'.
//             const [updateResult] = await connection.execute(`
//                 UPDATE UsersRegistrationLocations
//                 SET state = 'finalizado'
//                 WHERE iduser = ? AND state = 'activo'
//                 ORDER BY id DESC
//                 LIMIT 1
//             `, [iduser]);

//             // Se verifica si se actualizó correctamente el estado del registro.
//             if (updateResult.affectedRows === 0) {
//                 res.status(404).send('No se encontró ningún registro de jornada activo para este usuario.');
//                 console.log('No se encontró ningún registro de jornada activo para este usuario.');
//                 return;
//             } else {
//                 console.log('La jornada ha finalizado.');
//                 const response = {
//                     message: 'La jornada ha finalizado.'
//                 };
//                 res.send(response);
//             }
//         } else if (currentState === 'finalizado') {
//             console.log('La jornada ya estaba finalizado.');
//             const response = {
//                 message: 'La jornada ya estaba finalizado.'
//             };
//             res.send(response);
//         } else {
//             console.log('El state del registro de jornada no es reconocido.');
//             res.status(500).send('El state del registro de jornada no es reconocido.');
//         }

//         // Se cierra la conexión a la base de datos.
//                 await connection.end();

//             } catch (error) {
//                 console.error('Error al ejecutar SQL query:', error);
//                 res.status(500).send('Error al ejecutar SQL query');
//             } finally {
//                 sshConnection.end();
//             }
//         });

//         sshConnection.connect(sshConfig);

//     } catch (error) {
//         console.error('Error al conectar via SSH:', error);
//         res.status(500).send('Error al conectar via SSH');
//     }
// });

// module.exports = routerRegister;

// MODO LOCAL
const express = require('express');
const { DateTime } = require('luxon');
const mysql = require('mysql2/promise');
const strftime = require('strftime');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '3studi@nta',
    database: 'registrohorario',
    port: 3306
};

const routerRegister = express.Router();

// Endpoint para obtener registros de jornada.
routerRegister.post('/records', async (req, res) => {
    try {
        // Se crea conexión a la base de datos.
        const connection = await mysql.createConnection(dbConfig);

        // Se crea una consulta SQL para obtener registros de jornada.
        const [rows, fields] = await connection.execute(`
            SELECT ur.id AS userID, u.date, t.name AS typeName, l.label AS locationLabel, ur.id AS userIdFromUserRegistration
            FROM UsersRegistrationLocations u
            JOIN _RegistrationsTypes t ON u.idtypes = t.id
            JOIN Locations l ON u.idlocations = l.id
            JOIN Users ur ON u.iduser = ur.id
            WHERE u.state = 'activo'
        `);

        // Se le da formato a los registros.
        const formattedRecords = rows.map(row => ({
            userID: row.userID,
            date: strftime('%F %T', new Date(row.date)),
            type: {
                ID: row.typeID,
                name: row.typeName,
                location: row.locationLabel
            }
        }));

        // Se cerra la conexión a la base de datos.
        await connection.end();

        const response = {
            nextLink: "",
            prevLink: "",
            Records: formattedRecords
        };

        console.log(JSON.stringify(response, null, 2));
        res.send(response);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).send('Error executing SQL query');
    }
});

// {
//     "startDate": "2024-04-18",
//     "endDate": "2024-04-18",
//     "iduser": "1",
//     "idtype": "3",
//     "idlocations": "3",
//     "idrecords": "1"
// }

// Endpoint para crear nuevos registros de jornada.
routerRegister.put('/records', async (req, res) => {
    try {
        // Se extraen datos del cuerpo de la solicitud.
        const { startDate, endDate, iduser, idtype, idlocations } = req.body;

        console.log("idtype", idtype)

        // Se verifica si se proporcionaron todos los parámetros necesarios.
        if (!startDate ) {
            return res.status(400).send('Parámetros requeridos faltantes en startDate');
        }

        if (!endDate) {
            return res.status(400).send('Parámetros requeridos faltantes en endDate');
        }

        if (!iduser && iduser != 0 ) {
            return res.status(400).send('Parámetros requeridos faltantes en iduser');
        }

        if ( !idtype && idtype != 0 ) {
            return res.status(400).send('Parámetros requeridos faltantes en idtype');
        }

        if (!idlocations && idlocations != 0) {
            return res.status(400).send('Parámetros requeridos faltantes en idlocations');
        }

        const connection = await mysql.createConnection(dbConfig);

        // Se inserta un nuevo registro en la tabla Records.
        const [insertRecordResult] = await connection.execute(`
            INSERT INTO Records (iduser, startDate, endDate)
            VALUES (?, ?, ?)
        `, [iduser, startDate, endDate]);

        // Se verifica si se insertó correctamente el nuevo registro.
        if (insertRecordResult.affectedRows === 0) {
            await connection.end();
            return res.status(500).send('Error al insertar nuevo record en la tabla Records');
        }

        // Se obtienen y verifican si se encontraron los IDs necesarios.
        const recordId = insertRecordResult.insertId;

        // Se inserta un nuevo registro en la tabla UsersRegistrationLocations.
        const dateJs = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
        const [insertResult] = await connection.execute(`
            INSERT INTO UsersRegistrationLocations (iduser, idtypes, idlocations, date, idrecords, state)
            VALUES (?, ?, ?, ?, ?, 'activo')
        `, [iduser, idtype, idlocations, dateJs, recordId]);

        // Se verifica si se insertó correctamente el nuevo registro.
        if (insertResult.affectedRows === 0) {
            await connection.end();
            return res.status(500).send('Error al insertar nuevo record');
        }

        // Se obtiene el último registro de jornada para enviar como respuesta.
        const [rows, fields] = await connection.execute(`
            SELECT r.startDate, u_rl.date, r.endDate, r.iduser, u.name AS name, u.id AS userID, t.id AS typeID, t.name AS typeName, l.label AS locationLabel
            FROM UsersRegistrationLocations u_rl
            JOIN Records r ON u_rl.idrecords = r.id
            JOIN Users u ON r.iduser = u.id
            JOIN _RegistrationsTypes t ON u_rl.idtypes = t.id
            JOIN Locations l ON u_rl.idlocations = l.id
            ORDER BY r.id DESC
            LIMIT 1
        `);

        // Se cierra la conexión a la base de datos.
        await connection.end();

        // Se formatea el registro.
        const formattedRecords = rows.map(row => ({
            user: {
                ID: row.userID,
                name: row.name
            },
            date: row.date,
            type: {
                ID: row.typeID,
                name: row.typeName,
                location: row.locationLabel
            }
        }));

        const response = {
            startDate: startDate,
            endDate: endDate,
            user: iduser,
            result: {
                nextLink: "",
                prevLink: "",
                Records: formattedRecords
            }
        };

        console.log(JSON.stringify(response, null, 2));
        res.send(response);

    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
});


// {
//     "date": "2024-04-19 12:33:00",
//     "idtype": "1",
//     "idlocations": "7"
// }

// Endpoint para actualizar un registro de jornada.
routerRegister.patch('/records/:iduser', async (req, res) => {
    try {
        const iduser = req.params.iduser;
        const { date, idtype, idlocations } = req.body;

        console.log(req.body)

        const connection = await mysql.createConnection(dbConfig);

        // Se obtiene el último registro activo del iduser.
        const [lastRecordResult] = await connection.execute(`
            SELECT id FROM UsersRegistrationLocations WHERE iduser = ? AND state = 'activo' ORDER BY id DESC LIMIT 1
        `, [iduser]);

        if (lastRecordResult.length === 0) {
            res.status(404).send('No se encontró el registro activo a actualizar');
            await connection.end();
            return;
        }

        const lastRecordId = lastRecordResult[0].id;
        

        // Se actualiza parcialmente el último registro activo del iduser.
        const [updateResult] = await connection.execute(`
            UPDATE UsersRegistrationLocations SET idtypes = ?, idlocations = ?, date = ? WHERE id = ?
        `, [idtype, idlocations, date, lastRecordId]);

        if (updateResult.affectedRows === 0) {
            res.status(404).send('No se encontró el registro a actualizar');
            await connection.end();
            return;
        }

        // Se obtiene el registro actualizado.
        const [rows] = await connection.execute(`
            SELECT u.name AS userName, r.date, r.iduser, u.id AS userID, t.id AS typeID, t.name AS typeName, l.label AS locationLabel
            FROM UsersRegistrationLocations r
            JOIN Users u ON r.iduser = u.id
            JOIN _RegistrationsTypes t ON r.idtypes = t.id
            JOIN Locations l ON r.idlocations = l.id
            WHERE r.id = ?
        `, [lastRecordId]);

        const updatedRecord = rows.map(row => ({
            result: {
                user: {
                    ID: row.userID,
                    name: row.userName
                },
                date: new Date(row.date).toISOString().replace('T', ' ').substr(0, 19),  // Se usa el formato YYYY-MM-DD HH:MM:SS.
                type: {
                    ID: row.typeID,
                    name: row.typeName,
                    location: row.locationLabel
                }
            }
        }));

        await connection.end();

        const response = {
            Record: updatedRecord
        };

        console.log(JSON.stringify(response, null, 2));
        res.send(response);

    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
});

routerRegister.patch('/records/Time/:iduser', async (req, res) => {
    try {
        // Se obtiene la ID del usuario y el nuevo tiempo proporcionado en la solicitud.
        const iduser = req.params.iduser;
        const { newTime } = req.body;

        // Validar que el nuevo tiempo esté presente en la solicitud y tenga el formato correcto.
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
        if (!newTime || !timeRegex.test(newTime)) {
            res.status(400).send('El nuevo tiempo debe estar presente y tener el formato HH:mm:ss.');
            return;
        }

        const connection = await mysql.createConnection(dbConfig);

        // Se actualiza el tiempo del registro de jornada activo para el usuario.
        const [updateResult] = await connection.execute(`
            UPDATE UsersRegistrationLocations
            SET totalTime = ?
            WHERE iduser = ? AND state = 'activo'
            ORDER BY id DESC
            LIMIT 1
        `, [newTime, iduser]);

        // Se verifica si se actualizó correctamente el tiempo del registro.
        if (updateResult.affectedRows === 0) {
            res.status(404).send('No se encontró ningún registro de jornada activo para este usuario.');
            console.log('No se encontró ningún registro de jornada activo para este usuario.');
            return;
        } else {
            console.log('Se ha actualizado el tiempo del registro de jornada.');
            const response = {
                message: 'Se ha actualizado el tiempo del registro de jornada.'
            };
            res.send(response);
        }

        // Se cierra la conexión a la base de datos.
        await connection.end();

    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
});


// Endpoint para eliminar un registro de jornada.
routerRegister.delete('/records/:iduser', async (req, res) => {
    try {
        // Se obtiene la ID del usuario, luego se crea la conexión a la base de datos.
        const iduser = req.params.iduser;

        const connection = await mysql.createConnection(dbConfig);

        // Se obtiene el último registro de jornada del usuario.
        const [lastRecordResult] = await connection.execute(`
            SELECT state FROM UsersRegistrationLocations
            WHERE iduser = ?
            ORDER BY id DESC
            LIMIT 1
        `, [iduser]);

        if (lastRecordResult.length === 0) {
            res.status(404).send('No se encontró ningún registro de jornada para este usuario.');
            console.log('No se encontró ningún registro de jornada para este usuario.');
            return;
        }

        const currentState = lastRecordResult[0]?.state;

        // Se verifica el estado del último registro de jornada.
        if (currentState === 'activo') {
            console.log('El registro de jornada estaba activo. Actualizando a finalizado...');
            // Se actualiza el estado del registro a 'finalizado'.
            const [updateResult] = await connection.execute(`
                UPDATE UsersRegistrationLocations
                SET state = 'finalizado'
                WHERE iduser = ? AND state = 'activo'
                ORDER BY id DESC
                LIMIT 1
            `, [iduser]);

            // Se verifica si se actualizó correctamente el estado del registro.
            if (updateResult.affectedRows === 0) {
                res.status(404).send('No se encontró ningún registro de jornada activo para este usuario.');
                console.log('No se encontró ningún registro de jornada activo para este usuario.');
                return;
            } else {
                console.log('La jornada ha finalizado.');
                const response = {
                    message: 'La jornada ha finalizado.'
                };
                res.send(response);
            }
        } else if (currentState === 'finalizado') {
            console.log('La jornada ya estaba finalizado.');
            const response = {
                message: 'La jornada ya estaba finalizado.'
            };
            res.send(response);
        } else {
            console.log('El state del registro de jornada no es reconocido.');
            res.status(500).send('El state del registro de jornada no es reconocido.');
        }

        // Se cierra la conexión a la base de datos.
        await connection.end();

    } catch (error) {
        console.error('Error al ejecutar SQL query:', error);
        res.status(500).send('Error al ejecutar SQL query');
    }
});

module.exports = routerRegister;