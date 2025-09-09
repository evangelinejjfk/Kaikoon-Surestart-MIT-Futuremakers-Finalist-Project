import React from 'react';
import { useUserCollection } from '../helpers/useCollectibles';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import { Link } from 'react-router-dom';
import styles from './UserCollection.module.css';

const CollectionItemSkeleton = () => (
  <div className={styles.collectionItem}>
    <Skeleton style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)' }} />
    <Skeleton style={{ height: '1.25rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
  </div>
);

export const UserCollection = () => {
  const { data: userCollection, isFetching, error } = useUserCollection();

  if (error) {
    return <div className={styles.errorState}>Could not load your collection. Please try again later.</div>;
  }

  if (isFetching && !userCollection) {
    return (
      <div className={styles.collectionGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <CollectionItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!userCollection || userCollection.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>Your Garden is Empty</h3>
        <p>Visit the shop to start growing your collection!</p>
        <Link to="/collectibles#shop" className={styles.shopLink}>Go to Shop</Link>
      </div>
    );
  }

  return (
    <div className={styles.collectionGrid}>
      {userCollection.map((item) => (
        <div key={item.userCollectibleId} className={styles.collectionItem}>
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
          <h4 className={styles.itemName}>{item.name}</h4>
          {item.quantity && item.quantity > 1 && (
            <Badge className={styles.quantityBadge}>x{item.quantity}</Badge>
          )}
        </div>
      ))}
    </div>
  );
};