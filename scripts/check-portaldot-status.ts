import "dotenv/config";
import { getPortaldotStatus } from "../src/lib/portaldot";

const status = await getPortaldotStatus();
console.log(JSON.stringify(status, null, 2));
if (!status.ok) process.exitCode = 1;

