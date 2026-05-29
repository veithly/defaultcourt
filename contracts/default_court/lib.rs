#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod default_court {
    #[ink(storage)]
    pub struct DefaultCourt {
        owner: AccountId,
        case_count: u64,
        cases: ink::storage::Mapping<u64, CaseRecord>,
    }

    #[derive(scale::Encode, scale::Decode, Clone, PartialEq, Eq, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum CaseStage {
        Performing,
        BreachActive,
        EvidenceFiled,
        QuorumReady,
        Resolved,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct CaseRecord {
        borrower_hash: Hash,
        evidence_hash: Hash,
        approvals: u8,
        stage: CaseStage,
        opened_at: Timestamp,
        resolved_at: Timestamp,
    }

    #[ink(event)]
    pub struct CaseOpened {
        #[ink(topic)]
        case_id: u64,
        borrower_hash: Hash,
    }

    #[ink(event)]
    pub struct CaseUpdated {
        #[ink(topic)]
        case_id: u64,
        stage: CaseStage,
        approvals: u8,
    }

    impl DefaultCourt {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                case_count: 0,
                cases: Default::default(),
            }
        }

        #[ink(message)]
        pub fn open_case(&mut self, borrower_hash: Hash) -> u64 {
            self.case_count += 1;
            let id = self.case_count;
            let record = CaseRecord {
                borrower_hash,
                evidence_hash: Hash::default(),
                approvals: 0,
                stage: CaseStage::Performing,
                opened_at: self.env().block_timestamp(),
                resolved_at: 0,
            };
            self.cases.insert(id, &record);
            self.env().emit_event(CaseOpened { case_id: id, borrower_hash });
            id
        }

        #[ink(message)]
        pub fn trigger_breach(&mut self, case_id: u64) -> bool {
            self.update_stage(case_id, CaseStage::BreachActive)
        }

        #[ink(message)]
        pub fn attach_evidence(&mut self, case_id: u64, evidence_hash: Hash) -> bool {
            if let Some(mut record) = self.cases.get(case_id) {
                record.evidence_hash = evidence_hash;
                record.stage = CaseStage::EvidenceFiled;
                self.cases.insert(case_id, &record);
                self.env().emit_event(CaseUpdated { case_id, stage: record.stage, approvals: record.approvals });
                return true;
            }
            false
        }

        #[ink(message)]
        pub fn approve_recovery(&mut self, case_id: u64) -> bool {
            if let Some(mut record) = self.cases.get(case_id) {
                record.approvals = record.approvals.saturating_add(1);
                if record.approvals >= 2 {
                    record.stage = CaseStage::QuorumReady;
                }
                self.cases.insert(case_id, &record);
                self.env().emit_event(CaseUpdated { case_id, stage: record.stage, approvals: record.approvals });
                return true;
            }
            false
        }

        #[ink(message)]
        pub fn resolve_case(&mut self, case_id: u64) -> bool {
            if let Some(mut record) = self.cases.get(case_id) {
                if record.approvals < 2 {
                    return false;
                }
                record.stage = CaseStage::Resolved;
                record.resolved_at = self.env().block_timestamp();
                self.cases.insert(case_id, &record);
                self.env().emit_event(CaseUpdated { case_id, stage: record.stage, approvals: record.approvals });
                return true;
            }
            false
        }

        #[ink(message)]
        pub fn get_case(&self, case_id: u64) -> Option<CaseRecord> {
            self.cases.get(case_id)
        }

        fn update_stage(&mut self, case_id: u64, stage: CaseStage) -> bool {
            if let Some(mut record) = self.cases.get(case_id) {
                record.stage = stage;
                self.cases.insert(case_id, &record);
                self.env().emit_event(CaseUpdated { case_id, stage: record.stage, approvals: record.approvals });
                return true;
            }
            false
        }
    }
}

