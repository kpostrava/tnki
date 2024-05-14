import { Server } from "socket.io";

//* Herní mapa, 1 reprezentzuje překážku, 0 volnou cestu. Můžeš si jí libovolně upravit.
const map = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
];

//? Napadá tě způsob dynamického generování mapy? Můžeš si jej libovolně doimplementovat!

const shuffle_map = () => {
    return map.slice();
}

//* Barvy tanků
const colors = ["red", "green", "blue", "yellow"];

//* Souřadnice spawnu jednotlivých tanků
const start_positions = [
    { x: 0, y: 0 },
    { x: 11, y: 0 },
    { x: 0, y: 11 },
    { x: 11, y: 11 },
];

//? Změnil jsi ovládání pohybu? Ujisti se, že jsou u klineta nastaveny stejné klávesy jako zde!
const map_key_value = new Map([
    ["ArrowUp", { x: 0, y: -1 }],
    ["ArrowLeft", { x: -1, y: 0 }],
    ["ArrowDown", { x: 0, y: 1 }],
    ["ArrowRight", { x: 1, y: 0 }],
]);

const rooms = new Map();
const map_id_room = new Map();

class Room {
    started = false;
    tanks = new Map();

    constructor(session_id, tank, max_players, room_name, game_map) {
        this.admin = session_id;
        this.max_players = max_players;
        this.room_name = room_name;
        this.game_map = game_map;

        this.tanks.set(session_id, tank);
        map_id_room.set(session_id, room_name);
    }

    join(session_id, tank) {
        this.tanks.set(session_id, tank);
        map_id_room.set(session_id, this.room_name);
    }

    //TODO: Vytvoř metodu pro smazání hráče ze serveru

    tanks_length() {
        return this.tanks.size;
    }

    //TODO: Implementuj metodu pro doplnění nábojů

}

class Tank {
    constructor(index, player_name, session_id) {
        //TODO: Přidej tanku potřebné atributy - směr, životy, náboje
        this.x = start_positions[index].x;
        this.y = start_positions[index].y;
        this.color = colors[index];
        this.player_name = player_name;
        this.index = index;
        this.session_id = session_id;
    }


    //! Místo této funkce
    //TODO: Vytvoř metodu, která ověří správnost souřadnic
    validate_move() {
        return true;
    }

    move(key, shift) {
        const action = map_key_value.get(key);

        //TODO: Pokud je stisknuta klávesa "shift", tak tank mění pouze směr

        if (this.validate_move([this.x + action.x, this.y + action.y])) {
            this.x += action.x;
            this.y += action.y;

            //TODO: Automatická změna směru, dle pohybu. Nezapomeň tuto informaci zahrnout v return statementu!

            return [{ property: "x", value: this.x }, { property: "y", value: this.y }];
        }

        return false;
    }

    shoot() {
        //TODO: Ověř dostatek nábojů pro střelbu

        //TODO: Nezapomeň tanku po výstřelu odebrat náboj!

        let first_baricade = {}
        const hits = [];

        let map_cp = rooms.get(map_id_room.get(this.session_id)).game_map;

        //TODO: Změň směr střely podle natočení tanku

        let dir_coef = { x: 1, y: 0 };

        for (let i = 1; i <= map_cp.length; i++) {
            //* Kolize střely se zdí
            if (map_cp[this.y + i * dir_coef.y] === undefined || map_cp[this.y + i * dir_coef.y][this.x + i * dir_coef.x] === undefined) {
                first_baricade = { x: this.x + (i - 1) * dir_coef.x, y: this.y + (i - 1) * dir_coef.y };
                break;
            };

            //TODO: Zachyť kolizi střely s barikádou

            //TODO: Najdi zasáhnuté tanky a zavolej na nich metodu hit()
        }
        return { path: [first_baricade, { x: this.x, y: this.y }], hits: hits };
    }
}

const io = new Server(3000, { cors: { origin: '*' } });

//TODO: Vytvoř interval, který bude pravidelně doplňovat náboje

io.on("connection", (socket) => {
    socket.on("create_room", (msg) => {
        if (rooms.has(msg.room_name)) {
            socket.emit("error", { message: "Room with this name already exists" });
            return;
        }

        //TODO: Přidej podmínku pro ověření, že název místnosti má maximálně 10 znaků

        //TODO: Přidej podmínku pro ověření, že přezdívka hráče má maximálně 10 znaků

        const admin_tank = new Tank(0, msg.player_name, socket.id);

        rooms.set(msg.room_name, new Room(socket.id, admin_tank, msg.max_players, msg.room_name, shuffle_map()));

        socket.join(msg.room_name);

        socket.emit("room_joined", { player_index: 0, room_name: msg.room_name, max_players: msg.max_players });
    });

    socket.on("join_room", (msg) => {
        const room = rooms.get(msg.room_name);

        if (!room) {
            socket.emit("error", { message: "Room with this name doesn't exist! You can create one." });
            return;
        }

        if (room.started) {
            socket.emit("error", { message: "Room already started!" });
            return;
        }

        if (room.tanks_length() == room.max_players) {
            socket.emit("error", { message: "Room is full!" });
            return;
        }

        //TODO: Přidej podmínku pro ověření, že přezdívka hráče má maximálně 10 znaků

        const new_tank = new Tank(room.tanks_length(), msg.player_name, socket.id);

        room.join(socket.id, new_tank);

        socket.join(msg.room_name);

        socket.emit("room_joined", { player_index: new_tank.index, room_name: msg.room_name, max_players: room.max_players });

        io.to(msg.room_name).emit("update_players", { player_count: room.tanks_length(), max_players: room.max_players });
    })

    //TODO: Přidej event handler pro doborovolné odpojení hráče z čekajcí místnosti (lobby)
    socket.on("leave_room", () => {
    });

    socket.on("start_room", () => {
        const room = rooms.get(map_id_room.get(socket.id));

        //TODO: Přidej podmínku, aby mohl místnost spustit jen admin

        room.started = true;
        io.to(room.room_name).emit("room_started", { tanks: [...room.tanks.entries()], map: map, room_name: room.room_name });
    });

    socket.on("update_move", (msg) => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            //Místnost není aktivní!
            return;
        };

        const tank = room.tanks.get(socket.id);

        const update_msg = tank.move(msg.key, msg.shift);

        if (update_msg) {
            io.to(room.room_name).emit("move_updated", { id: socket.id, update: update_msg });
        }
    });

    socket.on("update_shoot", () => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            return;
        };

        const tank = room.tanks.get(socket.id);

        const update_msg = tank.shoot();

        if (update_msg) {
            io.to(room.room_name).emit("shoot_updated", update_msg);
            io.to(room.room_name).emit("ammo_updated", { tank_id: tank.id, ammo: tank.ammo });
        }
    });

    socket.on('disconnect', () => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            //Místnost není aktivní!
            return;
        }

        //TODO: Nezapomeň zavolat metodu kick pro smazání dat o hráči

        io.to(room.room_name).emit("player_left", { player_id: socket.id });

        if (room.tanks_length() === 1) {
            io.to(room.room_name).emit("win");
        }
    });
});