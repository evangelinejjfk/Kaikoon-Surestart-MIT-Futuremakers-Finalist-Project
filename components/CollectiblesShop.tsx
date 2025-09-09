import React from 'react';
import { useCollectibles, usePurchaseCollectible } from '../helpers/useCollectibles';
import { useUserProgress } from '../helpers/useTaskQueries';
import { useUserCollection } from '../helpers/useCollectibles';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';
import { type UserCollectionItem } from '../endpoints/collectibles/user-collection_GET.schema';
import styles from './CollectiblesShop.module.css';

const CollectibleItemSkeleton = () => (
  <div className={styles.itemCard}>
    <Skeleton style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)' }} />
    <Skeleton style={{ height: '1.25rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
    <Skeleton style={{ height: '1rem', width: '50%', marginTop: 'var(--spacing-1)' }} />
    <Skeleton style={{ height: '2.5rem', width: '100%', marginTop: 'var(--spacing-3)', borderRadius: 'var(--radius-full)' }} />
  </div>
);

export const CollectiblesShop = () => {
  const { data: collectibles, isFetching: isFetchingCollectibles, error: collectiblesError } = useCollectibles();
  const { data: userProgress, isFetching: isFetchingUserProgress } = useUserProgress();
  const { data: userCollection } = useUserCollection();
  const purchaseMutation = usePurchaseCollectible();

  const userPoints = userProgress?.kaibloomsPoints ?? 0;
  const isLoading = isFetchingCollectibles || isFetchingUserProgress;

  const handlePurchase = (collectibleTypeId: number) => {
    purchaseMutation.mutate({ collectibleTypeId });
  };

  const ownedMap = new Map<number, UserCollectionItem>();
  userCollection?.forEach(item => {
    ownedMap.set(item.collectibleTypeId, item);
  });

  if (collectiblesError) {
    return <div className={styles.errorState}>Could not load the shop. Please try again later.</div>;
  }

  return (
    <div className={styles.shopContainer}>
      <div className={styles.shopGrid}>
        {isLoading && !collectibles
          ? Array.from({ length: 5 }).map((_, index) => <CollectibleItemSkeleton key={index} />)
          : collectibles?.map((item) => {
              const isOwned = ownedMap.has(item.id);
              const canAfford = userPoints >= item.cost;
              const isPurchasing = purchaseMutation.isPending && purchaseMutation.variables?.collectibleTypeId === item.id;

              return (
                <div key={item.id} className={`${styles.itemCard} ${!canAfford && !isOwned ? styles.unaffordable : ''}`}>
                  <div className={styles.emojiBackground}>
                    {item.emoji.startsWith('http') ? (
                      <img 
                        src={item.emoji} 
                        alt={item.name}
                        className={styles.emojiImage}
                      />
                    ) : (
                      <span className={styles.emoji}>{item.emoji}</span>
                    )}
                  </div>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDescription}>{item.description}</p>
                  <div className={styles.costContainer}>
                    <img 
                      src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/2dccdf8e-81e5-41bf-ac41-78c535495933.png" 
                      alt="Kaibloom currency" 
                      className={styles.pointsLogo}
                    />
                    <span className={styles.cost}>{item.cost}</span>
                  </div>
                  <Button
                    onClick={() => handlePurchase(item.id)}
                    disabled={!canAfford || isPurchasing}
                    className={styles.purchaseButton}
                    variant={isOwned ? 'secondary' : 'primary'}
                  >
                    {isPurchasing ? (
                      <Spinner size="sm" />
                    ) : isOwned ? (
                      'Buy Another'
                    ) : (
                      'Buy'
                    )}
                  </Button>
                </div>
              );
            })}
      </div>
    </div>
  );
};