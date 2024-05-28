import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, CreateCandyMachineInput, DefaultCandyGuardSettings, 
    CandyMachineItem, toDateTime, sol, TransactionBuilder, CreateCandyMachineBuilderContext } from "@metaplex-foundation/js";
import { readFileSync } from 'fs';
import bs58 from 'bs58';

const QUICKNODE_RPC = "https://wild-alpha-wildflower.solana-devnet.quiknode.pro/93709d80bda6b91b2bb4c8c511cd44728a051ada/";


const secret = readFileSync(".secret", 'utf-8').trim();

const secretKey = bs58.decode(secret);

const WALLET = Keypair.fromSecretKey(secretKey);

const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q'; 
const COLLECTION_NFT_MINT = 'type ID'; 

const CANDY_MACHINE_ID = 'type ID';

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
.use(keypairIdentity(WALLET))
.use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: QUICKNODE_RPC,
    timeout: 60000,
}));

async function createCollectionNft() {
    const { nft: collectionNft } = await METAPLEX.nfts().create({
        name: "Kolekcja NFT",
        uri: NFT_METADATA,
        sellerFeeBasisPoints: 0,
        isCollection: true,
        updateAuthority: WALLET,
      });

      console.log(`✅ - Zmintowano kolekcję NFT: ${collectionNft.address.toString()}`);
      console.log(`     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`);
}
//createCollectionNft();

async function generateCandyMachine() {
    const candyMachineSettings: CreateCandyMachineInput<DefaultCandyGuardSettings> =
        {
            itemsAvailable: toBigNumber(3), // Collection Size: 3
            sellerFeeBasisPoints: 1000, // 10% Royalties on Collection
            symbol: "DEMO",
            maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
            isMutable: true,
            creators: [
                { address: WALLET.publicKey, share: 100 },
            ],
            collection: {
                address: new PublicKey(COLLECTION_NFT_MINT), // Can replace with your own NFT or upload a new one
                updateAuthority: WALLET,
            },
        };
    const { candyMachine } = await METAPLEX.candyMachines().create(candyMachineSettings);
    console.log(`✅ - Utworzono Candy Machine: ${candyMachine.address.toString()}`);
    console.log(`     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`);
}
//generateCandyMachine();

async function updateCandyMachine() {
    const candyMachine = await METAPLEX
        .candyMachines()
        .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });

    const { response } = await METAPLEX.candyMachines().update({
        candyMachine,
        guards: {
            startDate: { date: toDateTime("2024-05-27T16:00:00Z") },
            mintLimit: {
                id: 1,
                limit: 2,
            },
            solPayment: {
                amount: sol(0.1),
                destination: METAPLEX.identity().publicKey,
            },
        }
    })
    
    console.log(`✅ - Zaktualizowano Candy Machine: ${CANDY_MACHINE_ID}`);
    console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
}

//updateCandyMachine();
async function addItems() {
    const candyMachine = await METAPLEX
        .candyMachines()
        .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) }); 
    const items = [];
    for (let i = 0; i < 3; i++ ) { // Add 3 NFTs (the size of our collection)
        items.push({
            name: `NFT # ${i+1}`,
            uri: NFT_METADATA
        })
    }
    const { response } = await METAPLEX.candyMachines().insertItems({
        candyMachine,
        items: items,
      },{commitment:'finalized'});

    console.log(`✅ - Dodano elementy do Candy Machine: ${CANDY_MACHINE_ID}`);
    console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
}

//addItems();
//updateCandyMachine();
//createCollectionNft();
//generateCandyMachine();
//mintNft();
async function mintNft() {
    const candyMachine = await METAPLEX
        .candyMachines()
        .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) }); 
    let { nft, response } = await METAPLEX.candyMachines().mint({
        candyMachine,
        collectionUpdateAuthority: WALLET.publicKey,
        },{commitment:'finalized'})
  
    console.log(`✅ - Zmintowano NFT: ${nft.address.toString()}`);
    console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
    console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
}
mintNft();