import m0000 from "./0000_breezy_iron_fist.sql"
import m0001 from "./0001_nasty_baron_zemo.sql"
import m0002 from "./0002_loud_robbie_robertson.sql"
import m0003 from "./0003_rare_talon.sql"
import m0004 from "./0004_unknown_black_crow.sql"
import m0005 from "./0005_mute_peter_parker.sql"
import journal from "./meta/_journal.json"

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
  },
}
