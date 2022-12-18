import { GrowdeverEntity } from "./../../../src/app/shared/database/entities/growdever.entity";
import { EnderecoEntity } from "./../../../src/app/shared/database/entities/endereco.entity";
import { AvaliacaoEntity } from "./../../../src/app/shared/database/entities/avaliacao.entity";
import { Endereco } from "./../../../src/app/models/endereco.model";
import { Avaliacao } from "./../../../src/app/models/avaliacao.model";
import { createServer } from "./../../../src/main/config/server.config";
import { DatabaseConnection, RedisConnection } from "../../../src/main/database";
import { Growdever } from "../../../src/app/models/growdever.model";
import request from "supertest";
import { Request, Response, Router } from "express";

class CreateProjetoUseCase {
    public async execute() {
        return null;
    }
}

class ProjetoController {
    public async create(req: Request, res: Response) {
        const { nome, idGrowdever } = req.body;

        if (!nome) {
            return res.status(400).send({
                ok: false,
                message: "Nome não foi informado",
            });
        }

        if (!idGrowdever) {
            return res.status(400).send({
                ok: false,
                message: "Id do Growdever não foi informado",
            });
        }

        const usecase = new CreateProjetoUseCase();
        const result = await usecase.execute();

        if (!result) {
            return res.status(404).send({
                ok: false,
                message: "Growdever não encontrado",
            });
        }

        throw new Error("Not implemented");
    }
}

const projetoRoutes = () => {
    const router: Router = Router();

    router.post("/", new ProjetoController().create);

    return router;
};

describe("Testes da feature projeto usando TDD", () => {
    beforeAll(async () => {
        await DatabaseConnection.connect();
        await RedisConnection.connect();

        db = DatabaseConnection.connection.manager;
        app = createServer();

        jest.setTimeout(15000);

        app.use("/projeto", projetoRoutes());
    });

    afterAll(async () => {
        await DatabaseConnection.destroy();
        await RedisConnection.destroy();
    });

    beforeEach(async () => {
        // Limpa os dados das tabelas abaixo
        await db.clear(AvaliacaoEntity);
        await db.clear(EnderecoEntity);
        await db.clear(GrowdeverEntity);
    });

    let app: any;
    let db: any;

    const createGrowdever = async (growdever?: Growdever) => {
        growdever = growdever ?? new Growdever("teste", 12345, 20, ["nodejs"]);

        const growdeverEntity = db.create(Growdever, {
            id: growdever.id,
            cpf: growdever.cpf,
            idade: growdever.idade,
            nome: growdever.nome,
            skills: growdever.skills,
        });

        await db.save(growdeverEntity);

        return growdever;
    };

    const assertErrorWithMessage = (result: request.Response, code: number = 400, message?: string) => {
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("body.ok", false);
        expect(result).toHaveProperty("statusCode", code);

        if (message) {
            expect(result).toHaveProperty("body.message", message);
        }
    };

    test("deve retornar 400 se o nome do projeto não for informado", async () => {
        const body = {};

        const result = await request(app).post("/projeto").send(body);

        assertErrorWithMessage(result, 400, "Nome não foi informado");
    });

    test("deve retornar 400 se o id do growdever do projeto não for informado", async () => {
        const body = {
            nome: "Teste",
        };

        const result = await request(app).post("/projeto").send(body);

        assertErrorWithMessage(result, 400, "Id do Growdever não foi informado");
    });

    test("deve retornar 404 se o growdever não estiver cadastrado", async () => {
        const body = {
            nome: "Teste",
            idGrowdever: "abc-123",
        };

        const result = await request(app).post("/projeto").send(body);

        assertErrorWithMessage(result, 404, "Growdever não encontrado");
    });
});
