import { Request, Response } from "express";
import { BlockResolver, BlockStore } from "./block-store";
import express from "express";
import * as http from "http";

class BlockService implements BlockStore, BlockResolver {
  private blockStore: BlockStore;
  private blockResolver: BlockResolver;
  private app: express.Express;
  private server: http.Server;

  constructor(blockStore: BlockStore, blockResolver: BlockResolver) {
    this.blockStore = blockStore;
    this.blockResolver = blockResolver;
    this.app = express();
  }

  public httpServer(): http.Server {
    return this.server;
  }

  private async readBody(req: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      req.setEncoding(null);
      req.on(
        "data",
        (chunk: string) =>
          (buffer = Buffer.concat([buffer, Buffer.from(chunk)]))
      );
      req.on("end", () => resolve(buffer));
      req.on("error", reject);
    });
  }
  public async handlePutRequest(req: Request, res: Response): Promise<void> {
    const cid = req.query.cid;
    const bytes = await this.readBody(req);
    try {
      await this.blockStore.put({ cid, bytes });
      res.sendStatus(200);
    } catch (error) {
      console.error("Error handling PUT request:", error);
      res.sendStatus(500);
    }
  }

  public async handleGetRequest(req: Request, res: Response): Promise<void> {
    const cid = req.query.cid;
    try {
      const bytes = await this.blockStore.get(cid);
      if (bytes) {
        console.log(JSON.stringify(bytes));
        res.status(200).send(bytes);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error handling GET request:", error);
      res.sendStatus(500);
    }
  }

  public async handleResolveRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    const name = req.query.name as string;
    try {
      const result = await this.blockResolver.resolveName(name);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error handling RESOLVE request:", error);
      res.sendStatus(500);
    }
  }

  public async handleUpdateRequest(req: Request, res: Response): Promise<void> {
    const name = req.query.name as string;
    const cid = req.query.cid;
    try {
      await this.blockResolver.updateName(name, cid);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error handling UPDATE request:", error);
      res.sendStatus(500);
    }
  }

  public start(port: number, callback: () => void): http.Server {
    // Enable CORS for all origins
    this.app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
    this.app.use(express.json());
    this.app.put("/", (req: Request, res: Response) =>
      this.handlePutRequest(req, res)
    );
    this.app.get("/", (req: Request, res: Response) =>
      this.handleGetRequest(req, res)
    );
    this.app.get("/resolve", (req: Request, res: Response) =>
      this.handleResolveRequest(req, res)
    );
    this.app.put("/update", (req: Request, res: Response) =>
      this.handleUpdateRequest(req, res)
    );
    this.server = this.app.listen(port, callback);
    return this.server;
  }

  public stop(callback: () => void): void {
    this.server.close(callback);
  }

  public put(block: { cid: any; bytes: Uint8Array }): Promise<void> {
    return this.blockStore.put(block);
  }

  public get(cid: any): Promise<Uint8Array> {
    return this.blockStore.get(cid);
  }

  public resolveName(name: string): Promise<any> {
    return this.blockResolver.resolveName(name);
  }

  public updateName(name: string, cid: any): Promise<void> {
    return this.blockResolver.updateName(name, cid);
  }
}

export { BlockService };
