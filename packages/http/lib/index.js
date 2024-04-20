import Koa from "koa";
import Router from "koa-router";
const app = new Koa();
const router = new Router();
router.get("/", async (ctx) => {
    ctx.body = "Hello World";
});
app.use(router.routes());
function serverStart() {
    app.listen(3000, () => {
        console.log("Server is running at http://localhost:300021");
    });
    console.log("Server is running at http://localhost:3000");
}
// serverStart();
app.listen(3000, () => {
    console.log("Server is running at http://localhost:300021");
});
console.log("Server is running at http://localhost:3000");
