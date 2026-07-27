import { Router } from 'express';
import { createListing, purchaseListing, getOrder, transferCoins } from '../controllers/marketplaceController';

const router = Router();

router.post('/listings', createListing);
router.post('/listings/:listingId/purchase', purchaseListing);
router.get('/orders/:orderId', getOrder);
router.post('/coins/transfer', transferCoins);

export default router;
