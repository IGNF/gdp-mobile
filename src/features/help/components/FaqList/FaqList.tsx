import { useState } from 'react';

import { FAQ_ITEMS } from '@/features/help/content/faq';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import styles from './FaqList.module.css';

export interface FaqListProps {
  /** Ferme la question ouverte quand la page d’aide se referme. */
  active: boolean;
}

export function FaqList({ active }: FaqListProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  // Ferme la question ouverte pendant le rendu plutôt que dans un effet (pas de
  // resynchronisation avec un système externe ici) : se stabilise dès que c'est fait.
  if (!active && openQuestion !== null) {
    setOpenQuestion(null);
  }

  return (
    <section className={styles.list}>
      {FAQ_ITEMS.map((item) => {
        const isOpen = openQuestion === item.question;
        return (
          <article key={item.question} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isOpen}
              onClick={() => setOpenQuestion(isOpen ? null : item.question)}
            >
              <span className={styles.question}>{item.question}</span>
              {isOpen ? (
                <span className={styles.close}>
                  <IconClose className={styles.icon} aria-hidden />
                </span>
              ) : (
                <span className={styles.plus} aria-hidden>
                  +
                </span>
              )}
            </button>
            {isOpen ? <p className={styles.answer}>{item.answer}</p> : null}
          </article>
        );
      })}
    </section>
  );
}
