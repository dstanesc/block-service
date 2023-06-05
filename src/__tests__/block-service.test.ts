import axios, { AxiosInstance, AxiosResponse } from "axios";
import { BlockService } from "../block-service";
import {
  Block,
  BlockResolver,
  BlockStore,
  memoryBlockResolverFactory,
  memoryBlockStoreFactory,
} from "../block-store";

describe("BlockService", () => {
  let blockStore: BlockStore;
  let blockResolver: BlockResolver;
  let server: any;
  let blockService: BlockService;
  let httpClient: AxiosInstance;

  beforeAll((done) => {
    blockStore = memoryBlockStoreFactory();
    blockResolver = memoryBlockResolverFactory();
    blockService = new BlockService(blockStore, blockResolver);
    server = blockService.start(3000, done); // Start the server
    httpClient = axios.create({
      baseURL: "http://localhost:3000",
    });
  });

  afterAll((done) => {
    blockService.stop(done); // Stop the server
  });

  describe("storeBlock", () => {
    it("should store a block with the given CID and bytes", async () => {
      const cid = "QmV5kz2FJNpGk7U2qL7v6QbC5w5VQcCv8YsZmUH5y1Ux";
      const bytes = new TextEncoder().encode("hello world");
      await storeBlock(httpClient, cid, bytes);
    });
  });

  describe("retrieveBlock", () => {
    it("should retrieve a block with the given CID", async () => {
      const cid = "QmV5kz2FJNpGk7U2qL7v6QbC5w5VQcCv8YsZmUH5y1Ux";
      const block = await retrieveBlock(httpClient, cid);
      expect(block).not.toBeNull();
      const expected = new TextEncoder().encode("hello world");
      expect(block.bytes).toStrictEqual(expected);
      expect(block.cid).toStrictEqual(cid);
    });
  });

  describe("updateBlockName", () => {
    it("should update the name of a block with the given CID", async () => {
      const cid = "QmV5kz2FJNpGk7U2qL7v6QbC5w5VQcCv8YsZmUH5y1Ux";
      const name = "example.com";
      await updateBlockName(httpClient, name, cid);
      const resolvedCid = await resolveBlockName(httpClient, name);
      expect(resolvedCid).toBe(cid);
    });
  });

  describe("resolveBlockName", () => {
    it("should resolve a block name to a CID", async () => {
      const name = "example.com";
      const cid = await resolveBlockName(httpClient, name);
      expect(cid).not.toBeNull();
      expect(cid).toStrictEqual("QmV5kz2FJNpGk7U2qL7v6QbC5w5VQcCv8YsZmUH5y1Ux");
    });
  });
});

async function storeBlock(
  httpClient: any,
  cid: string,
  bytes: Uint8Array
): Promise<void> {
  await httpClient.put("/", bytes, {
    params: {
      cid: cid,
    },
    headers: {
      "Content-Type": "application/octet-stream",
    },
    data: bytes,
  });
}

async function retrieveBlock(
  httpClient: any,
  cid: string
): Promise<Block | null> {
  const response: AxiosResponse<ArrayBuffer> = await httpClient.get("/", {
    responseType: "arraybuffer",
    params: {
      cid: cid,
    },
  });
  if (response.data) {
    const block: Block = {
      cid: cid,
      bytes: new Uint8Array(response.data),
    };

    return block;
  }

  return null;
}
async function resolveBlockName(
  httpClient: any,
  name: string
): Promise<string | null> {
  const response: AxiosResponse<string> = await httpClient.get("/resolve", {
    params: {
      name: name,
    },
  });

  if (response.data) {
    return response.data;
  }

  return null;
}

async function updateBlockName(
  httpClient: any,
  name: string,
  cid: any
): Promise<void> {
  await httpClient.put(
    "/update",
    {},
    {
      params: {
        name: name,
        cid: cid,
      },
    }
  );
}
