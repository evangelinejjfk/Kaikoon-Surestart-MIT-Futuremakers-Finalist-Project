import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { CollectiblesShop } from '../components/CollectiblesShop';
import { UserCollection } from '../components/UserCollection';
import { useUserProgress } from '../helpers/useTaskQueries';
import { Skeleton } from '../components/Skeleton';
import styles from './collectibles.module.css';

type Tab = 'collection' | 'shop';

const CollectiblesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('collection');
  const { data: userProgress, isFetching: isFetchingProgress } = useUserProgress();

  return (
    <>
      <Helmet>
        <title>Collectibles | KAIKOON</title>
        <meta name="description" content="Browse the shop and view your collection of digital items." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <Button asChild variant="ghost" size="icon" className={styles.backButton}>
            <Link to="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <h1 className={styles.title}>Collectibles</h1>
          <div className={styles.pointsCounter}>
            {isFetchingProgress && !userProgress ? (
              <Skeleton style={{ height: '1.5rem', width: '100px' }} />
            ) : (
              <>
                <img
                  src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/2dccdf8e-81e5-41bf-ac41-78c535495933.png"
                  alt="Kaibloom currency"
                  className={styles.pointsLogo}
                />
                <span className={styles.pointsValue}>{userProgress?.kaibloomsPoints ?? 0}</span>
              </>
            )}
          </div>
        </header>

        <nav className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'collection' ? styles.active : ''}`}
            onClick={() => setActiveTab('collection')}
            aria-current={activeTab === 'collection'}
          >
            <Leaf size={18} />
            My Garden
          </button>
          <button
            id="shop"
            className={`${styles.tabButton} ${activeTab === 'shop' ? styles.active : ''}`}
            onClick={() => setActiveTab('shop')}
            aria-current={activeTab === 'shop'}
          >
            <ShoppingBag size={18} />
            Shop
          </button>
        </nav>

        <main className={styles.mainContent}>
          {activeTab === 'collection' && <UserCollection />}
          {activeTab === 'shop' && <CollectiblesShop />}
        </main>
      </div>
    </>
  );
};

export default CollectiblesPage;