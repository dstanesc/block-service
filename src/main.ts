import { BlockService } from "./block-service";
import {
  BlockStore,
  BlockResolver,
  memoryBlockResolverFactory,
  memoryBlockStoreFactory,
} from "./block-store";

const port = 3000;
const blockStore: BlockStore = memoryBlockStoreFactory();
const blockResolver: BlockResolver = memoryBlockResolverFactory();
const blockService = new BlockService(blockStore, blockResolver);
blockService.start(port, () => {
  console.log(`BlockService HTTP server started on port ${port}`);
});
