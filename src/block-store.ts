interface Block {
  cid: string;
  bytes: Uint8Array;
}

interface BlockResolver {
  resolveName(name: string): Promise<any>;
  updateName(name: string, cid: any): Promise<void>;
}

interface BlockStore {
  put: (block: { cid: any; bytes: Uint8Array }) => Promise<void>;
  get: (cid: any) => Promise<Uint8Array>;
}

interface MemoryBlockStore extends BlockStore {
  push: (otherStore: BlockStore) => Promise<void>;
  countReads: () => number;
  resetReads: () => void;
  size: () => number;
  reset: () => void;
}

const memoryBlockStoreFactory = (): MemoryBlockStore => {
  const blocks = {};
  let readCounter = 0;
  const put = async (block: { cid: any; bytes: Uint8Array }): Promise<void> => {
    blocks[block.cid.toString()] = block.bytes;
  };
  const get = async (cid: any): Promise<Uint8Array> => {
    const bytes = blocks[cid.toString()];
    console.log("get", cid.toString(), bytes, blocks);
    if (!bytes === undefined)
      throw new Error("Block Not found for " + cid.toString());
    readCounter++;
    return bytes;
  };

  const push = async (otherStore: BlockStore): Promise<void> => {
    const cids = Object.keys(blocks);
    for (const cid of cids) {
      const bytes = blocks[cid];
      await otherStore.put({ cid, bytes });
    }
  };

  const countReads = () => readCounter;

  const resetReads = () => (readCounter = 0);

  const size = () => Object.keys(blocks).length;

  const reset = () => {
    Object.keys(blocks).forEach((key) => delete blocks[key]);
  };

  return { get, put, push, countReads, resetReads, size, reset };
};

const memoryBlockResolverFactory = (): BlockResolver => {
  const blockMap: Record<string, any> = {};

  const resolveName = async (name: string): Promise<any> => {
    const block = blockMap[name];
    if (!block) {
      throw new Error(`Block not found for name: ${name}`);
    }
    return block;
  };

  const updateName = async (name: string, cid: any): Promise<void> => {
    blockMap[name] = cid;
  };

  return { resolveName, updateName };
};

export {
  Block,
  BlockStore,
  BlockResolver,
  MemoryBlockStore,
  memoryBlockStoreFactory,
  memoryBlockResolverFactory,
};
