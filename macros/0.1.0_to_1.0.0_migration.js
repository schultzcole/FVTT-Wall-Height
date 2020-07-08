for (let wall of canvas.walls.placeables) {
    if (wall.data.flags && "wall-height" in wall.data.flags) {
        console.log(`migrating wall height for wall ${wall.data._id}`);
        const oldTop = wall.getFlag("wall-height", "wallHeightTop");
        const oldBottom =  wall.getFlag("wall-height", "wallHeightBottom");

        if (oldTop !== undefined || oldTop !== null || oldBottom !== undefined || oldBottom !== null) {
            wall.data.flags.wallHeight = {
                wallHeightTop: oldTop,
                wallHeightBottom: oldBottom
            };
        }

        delete wall.data.flags["wall-height"];
    } else {
        console.log(`wall height migration not necessary for wall ${wall.data._id}`);
    }
}