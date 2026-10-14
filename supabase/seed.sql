insert into reps(id,code,name,capacity,reviewed_on,review_due,purpose) values
 ('10000000-0000-0000-0000-000000000001','NORTH','Aroha North',4,current_date-20,current_date+70,'Territory planning'),
 ('10000000-0000-0000-0000-000000000002','SOUTH','Ben South',6,current_date-120,current_date-30,'') on conflict do nothing;
insert into accounts(id,external_id,name,country,segment,currency,annual_revenue_cents,workload,reviewed_on,review_due,purpose) values
 ('20000000-0000-0000-0000-000000000001','DEMO001','Harbour Components','NZ','Wholesale','NZD',240000000,3,current_date-10,current_date+80,'Account coverage'),
 ('20000000-0000-0000-0000-000000000002','DEMO002','Northern Supply','NZ','Wholesale','NZD',180000000,3,current_date-110,current_date-20,'Account coverage'),
 ('20000000-0000-0000-0000-000000000003','DEMO003','Southern Precision','NZ','Manufacturing','NZD',320000000,2,current_date-10,current_date+80,'Account coverage'),
 ('20000000-0000-0000-0000-000000000004','DEMO004','Coastal Distribution','NZ','Wholesale','NZD',90000000,1,null,null,''),
 ('20000000-0000-0000-0000-000000000005','DEMO005','Tasman Supplies','AU','Wholesale','AUD',170000000,2,current_date-10,current_date+80,'Account coverage') on conflict do nothing;
insert into plans(id,name,starts,ends,currency,target_cents,creator) values
 ('30000000-0000-0000-0000-000000000001','FY27 baseline',current_date-10,current_date+355,'NZD',100000000,'Demo planner') on conflict do nothing;
insert into territories(id,plan_id,code,name,rep_id,quota_cents) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','NORTH','Upper North','10000000-0000-0000-0000-000000000001',60000000),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','SOUTH','South','10000000-0000-0000-0000-000000000002',30000000) on conflict do nothing;
insert into assignments(plan_id,account_id,territory_id,rationale) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Existing relationship'),
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','Existing relationship'),
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000002','Local expertise') on conflict do nothing;
insert into followups(id,plan_id,note,due,owner) values
 ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Agree Coastal coverage and close the quota gap',current_date-3,'Demo planner') on conflict do nothing;
