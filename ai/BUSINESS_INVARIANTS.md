# Invariants métier

## Isolation

- ORG-01: toute donnée métier appartient à une seule Organization.
- ORG-02: Shop, Product, opération et acteur relèvent de la même Organization.
- CAT-01: Product appartient exclusivement à une Organization; organizationId immuable.
- CAT-02: code et barcode renseigné sont uniques dans l Organization.
- CAT-03: le nom d un Product est un texte Unicode non vide; aucune restriction ASCII ou limitée au français.
- CAT-04: la valeur saisie est conservée sans translittération; les comparaisons de recherche peuvent être normalisées sans modifier la valeur affichée.
- IAM-01: permission et périmètre boutique sont vérifiés à chaque action.

## Argent et historique

- MON-01: Money utilise un entier en unité mineure et une devise, jamais float.
- MON-02: prix, coût et libellés historiques sont snapshotés.
- FIN-01: marge brute = CA moins coût vendu.
- FIN-02: résultat estimé = marge brute moins dépenses actives moins pertes valorisées.
- FIN-03: le résultat estimé n est pas un bénéfice comptable officiel.

## Stock et opérations

- INV-01: un StockLevel unique par Organization, Shop et Product.
- INV-02: toute variation crée un StockMovement immuable.
- INV-03: stock suivi jamais négatif; quantité commandée strictement positive.
- SAL-01: finalisation vente et mouvements sont atomiques; snapshots immuables.
- SAL-02: correction de vente par annulation et compensation auditée.
- TRF-01: source différente de destination, même Organization.
- TRF-02: DRAFT → SENT → RECEIVED; SENT est en transit; actions idempotentes.
- LOS-01: perte physique diminue le stock et n est jamais une Expense.
- CNT-01: écart inventaire devient ajustement explicite.
- EXP-01: amount positif, catégorie active, boutique de la même Organization.
- EXP-02: dépense immuable; correction par annulation motivée et nouvelle saisie.
- EXP-03: aucune ventilation arbitraire des dépenses organisationnelles.
- EXP-04: une entrée de stock ne crée pas automatiquement une Expense en V1.
