import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST || "192.168.1.252",
  user: process.env.DB_USER || "tsl11250",
  password: process.env.DB_PASSWORD || "1125011250",
  connectTimeout: 10000,
};

async function main() {
  try {
    const conn = await mysql.createConnection(config);
    console.log("CONNECTED_OK");

    const [dbs] = await conn.query("SHOW DATABASES");
    const names = dbs.map((r) => Object.values(r)[0]);
    console.log("DATABASES=" + JSON.stringify(names));

    const exists = names.includes("tsl_asset");
    console.log("TSL_ASSET_EXISTS=" + exists);

    if (exists) {
      await conn.changeUser({ database: "tsl_asset" });
      const [tables] = await conn.query("SHOW TABLES");
      console.log("TABLES=" + JSON.stringify(tables));
      const [grants] = await conn.query("SHOW GRANTS");
      console.log("GRANTS=" + JSON.stringify(grants));
    }

    await conn.end();
  } catch (err) {
    console.error("CONNECT_FAIL", err.message);
    process.exit(1);
  }
}

main();
