-- Production Intelligence Seed Dataset (25 Verified & Demo Production Companies)
-- Seed File: supabase/seed/seed.sql

-- 1. CLEANUP PREVIOUS SEED DATA (For reproducible seeding)
TRUNCATE TABLE user_saved_companies, alerts, company_scores, company_events, awards, company_people, people, company_projects, projects, social_profiles, company_categories, companies, sources CASCADE;

-- 2. INSERT SOURCES
INSERT INTO sources (id, source_type, source_name, url, title, publisher, credibility_score) VALUES
('s0000000-0000-0000-0000-000000000001', 'company_website', 'Official Website', 'https://morenafilms.com', 'Morena Films Official Portal', 'Morena Films', 98.00),
('s0000000-0000-0000-0000-000000000002', 'industry_press', 'Variety Article', 'https://variety.com', 'European Production Trends 2026', 'Variety', 92.00),
('s0000000-0000-0000-0000-000000000003', 'imdb', 'IMDbPro Profile', 'https://pro.imdb.com', 'IMDbPro Verified Company Data', 'IMDbPro', 95.00),
('s0000000-0000-0000-0000-000000000004', 'festival', 'Cannes Film Festival Registry', 'https://festival-cannes.com', 'Cannes Official Selection 2025', 'Cannes Film Festival', 99.00),
('s0000000-0000-0000-0000-000000000005', 'company_website', 'A24 Films Website', 'https://a24films.com', 'A24 Press & Slate', 'A24', 98.00);

-- 3. INSERT COMPANIES (25 Records)
INSERT INTO companies (
  id, name, slug, legal_name, description, company_type, founded_year, website_url,
  country_code, country_name, city, employee_count_min, employee_count_max, is_active,
  power_score, creative_score, commercial_score, momentum_score, international_score, social_score, mcl_match_score,
  score_confidence, ai_summary, last_verified_at
) VALUES
('c0000000-0000-0000-0000-000000000001', 'Morena Films', 'morena-films', 'Morena Films S.L.', 'Leading Spanish independent film and television production company producing award-winning feature films and high-end streaming originals.', 'independent', 1999, 'https://morenafilms.com', 'ES', 'Spain', 'Madrid', 15, 50, true, 88.50, 86.00, 90.00, 92.00, 85.00, 65.00, 94.00, 95.00, 'Top Spanish production house with strong feature film momentum and high post-production requirements.', NOW()),

('c0000000-0000-0000-0000-000000000002', 'A24', 'a24', 'A24 LLC', 'Prominent American independent entertainment company specializing in film distribution, feature film production, and television production.', 'independent', 2012, 'https://a24films.com', 'US', 'United States', 'New York', 100, 250, true, 96.00, 98.00, 94.00, 89.00, 90.00, 92.00, 88.00, 98.00, 'Global prestige powerhouse with major festival awards and consistent theatrical box office presence.', NOW()),

('c0000000-0000-0000-0000-000000000003', 'See-Saw Films', 'see-saw-films', 'See-Saw Films Ltd', 'Academy Award and BAFTA-winning independent film and television production company based in London and Sydney.', 'independent', 2008, 'https://see-saw-films.com', 'UK', 'United Kingdom', 'London', 30, 80, true, 92.00, 94.00, 89.00, 88.00, 93.00, 72.00, 92.50, 94.00, 'Renowned UK/Australian production company behind Slow Horses, Lion, and King Speech.', NOW()),

('c0000000-0000-0000-0000-000000000004', 'Fremantle', 'fremantle', 'FremantleMedia Group Ltd', 'Global television and film production and distribution company operating across 27 territories worldwide.', 'studio', 2001, 'https://fremantle.com', 'UK', 'United Kingdom', 'London', 1000, 5000, true, 95.00, 88.00, 96.00, 85.00, 98.00, 80.00, 91.00, 96.00, 'Massive international production backbone producing high-budget drama series and formats.', NOW()),

('c0000000-0000-0000-0000-000000000005', 'Gaumont', 'gaumont', 'Gaumont S.A.', 'The oldest film company in the world, producing major European series such as Lupin and international co-productions.', 'studio', 1895, 'https://gaumont.com', 'FR', 'France', 'Paris', 200, 500, true, 93.00, 91.00, 92.00, 78.00, 94.00, 70.00, 85.00, 97.00, 'Historic French studio with global series reach and high-budget streaming deals.', NOW()),

('c0000000-0000-0000-0000-000000000006', 'Wildside', 'wildside', 'Wildside S.r.l.', 'Leading Italian film and television production company behind international hits such as My Brilliant Friend and The Young Pope.', 'production_company', 2009, 'https://wildside.it', 'IT', 'Italy', 'Rome', 20, 60, true, 85.50, 89.00, 82.00, 84.00, 86.00, 60.00, 89.40, 92.00, 'Premier Italian producer of high-concept drama series and auteur cinema.', NOW()),

('c0000000-0000-0000-0000-000000000007', 'Bavaria Fiction', 'bavaria-fiction', 'Bavaria Fiction GmbH', 'Major German production company responsible for long-running series, TV movies, and international co-productions.', 'production_company', 2017, 'https://bavaria-fiction.de', 'DE', 'Germany', 'Munich', 100, 300, true, 86.00, 80.00, 87.00, 80.00, 82.00, 55.00, 82.00, 93.00, 'Key German TV fixture producing high-volume broadcast and streaming content.', NOW()),

('c0000000-0000-0000-0000-000000000008', 'Elephant Content', 'elephant-content', 'Elephant Group', 'Prominent French independent production group specializing in premium TV series, documentaries, and magazine shows.', 'independent', 2003, 'https://elephant-groupe.com', 'FR', 'France', 'Paris', 50, 150, true, 82.00, 83.00, 80.00, 81.00, 75.00, 58.00, 87.10, 90.00, 'Dynamic French independent with expanding fiction and documentary production capacity.', NOW()),

('c0000000-0000-0000-0000-000000000009', 'BTF Media', 'btf-media', 'BTF Media LLC', 'High-growth audiovisual production company in Mexico and Latin America, developing series and films for global platforms.', 'production_company', 2010, 'https://btfmedia.com', 'MX', 'Mexico', 'Mexico City', 50, 150, true, 81.00, 78.00, 83.00, 86.00, 79.00, 68.00, 85.30, 89.00, 'Rapidly expanding LatAm company focusing on bio-pics, premium series, and feature films.', NOW()),

('c0000000-0000-0000-0000-000000000010', 'Blumhouse Productions', 'blumhouse', 'Blumhouse Productions LLC', 'Renowned American production company known for pioneering high-return micro-budget horror and thriller cinema.', 'production_company', 2000, 'https://blumhouse.com', 'US', 'United States', 'Los Angeles', 50, 150, true, 94.00, 85.00, 99.00, 91.00, 92.00, 88.00, 84.00, 96.00, 'Highest commercial yield horror producer in Hollywood with heavy finishing operations.', NOW()),

('c0000000-0000-0000-0000-000000000011', 'Microscope', 'microscope', 'Microscope Productions', 'Independent UK arthouse and genre production company focusing on director-driven cinema.', 'independent', 2014, 'https://microscopefilms.com', 'UK', 'United Kingdom', 'London', 5, 15, true, 74.00, 85.00, 65.00, 72.00, 70.00, 48.00, 76.00, 82.00, 'Niche UK arthouse producer with strong festival pedigree.', NOW()),

('c0000000-0000-0000-0000-000000000012', 'Zeta Studios', 'zeta-studios', 'Zeta Audiovisual S.L.', 'Leading Spanish audiovisual producer known for hit Netflix originals like Elite and feature film comedies.', 'studio', 2011, 'https://zetastudios.com', 'ES', 'Spain', 'Madrid', 30, 100, true, 87.00, 82.00, 89.00, 87.00, 88.00, 75.00, 91.50, 94.00, 'Major Spanish streaming content producer with high post-production requirements.', NOW()),

('c0000000-0000-0000-0000-000000000013', 'Les Films du Losange', 'les-films-du-losange', 'Les Films du Losange', 'Prestigious French independent production and international sales company founded by Barbet Schroeder and Eric Rohmer.', 'independent', 1962, 'https://filmsdulosange.com', 'FR', 'France', 'Paris', 10, 30, true, 80.00, 95.00, 70.00, 65.00, 85.00, 50.00, 72.00, 91.00, 'Historic French arthouse distributor and producer with high artistic prestige.', NOW()),

('c0000000-0000-0000-0000-000000000014', 'LuckyChap Entertainment', 'luckychap', 'LuckyChap Entertainment LLC', 'Los Angeles-based film and television production company founded by Margot Robbie, Josey McNamara, and Tom Ackerley.', 'production_company', 2014, 'https://luckychapentertainment.com', 'US', 'United States', 'Los Angeles', 15, 40, true, 95.50, 92.00, 97.00, 95.00, 91.00, 85.00, 90.00, 95.00, 'Fastest growing Hollywood indie powerhouse behind Barbie and Saltburn.', NOW()),

('c0000000-0000-0000-0000-000000000015', 'Warp Films', 'warp-films', 'Warp Films Ltd', 'Acclaimed UK independent production company behind hard-hitting British indie films and high-end TV series.', 'independent', 2001, 'https://warpfilms.com', 'UK', 'United Kingdom', 'Sheffield', 10, 30, true, 81.00, 88.00, 75.00, 76.00, 78.00, 62.00, 83.00, 90.00, 'British indie classic producing bold television series and cinema.', NOW()),

('c0000000-0000-0000-0000-000000000016', 'Kino Produzioni', 'kino-produzioni', 'Kino Produzioni S.r.l.', 'Independent Italian film company dedicated to auteur cinema and international co-productions.', 'independent', 2011, 'https://kinoproduzioni.com', 'IT', 'Italy', 'Rome', 5, 15, true, 72.00, 84.00, 62.00, 70.00, 74.00, 45.00, 74.50, 85.00, 'Italian arthouse company with international co-production focus.', NOW()),

('c0000000-0000-0000-0000-000000000017', 'Comite Cine', 'comite-cine', 'Comité Cine S.A.', 'French boutique production studio producing documentaries and independent feature films.', 'documentary', 2016, 'https://comitecine.fr', 'FR', 'France', 'Lyon', 5, 20, true, 68.00, 76.00, 60.00, 68.00, 65.00, 40.00, 69.00, 80.00, 'Boutique French documentary and feature producer.', NOW()),

('c0000000-0000-0000-0000-000000000018', 'K5 International', 'k5-international', 'K5 Film GmbH', 'Munich-based production and financing company focusing on international English-language films.', 'independent', 2006, 'https://k5films.com', 'DE', 'Germany', 'Munich', 10, 25, true, 78.00, 79.00, 75.00, 69.00, 84.00, 52.00, 77.00, 88.00, 'German co-financier and producer of international English projects.', NOW()),

('c0000000-0000-0000-0000-000000000019', 'Neon Films', 'neon', 'Neon Rated LLC', 'American film production and distribution company known for Parasite and Oscar-winning international acquisitions.', 'independent', 2017, 'https://neonrated.com', 'US', 'United States', 'New York', 30, 80, true, 91.00, 96.00, 88.00, 88.00, 89.00, 84.00, 82.00, 93.00, 'High prestige US distributor and co-producer of festival winners.', NOW()),

('c0000000-0000-0000-0000-000000000020', 'Diagonal TV', 'diagonal-tv', 'Diagonal Televisió S.L.U.', 'One of Spain’s main television series production companies, member of Banijay Iberia.', 'broadcaster', 1997, 'https://diagonaltv.es', 'ES', 'Spain', 'Barcelona', 50, 200, true, 85.00, 79.00, 88.00, 80.00, 76.00, 58.00, 86.00, 92.00, 'High-volume Spanish TV series producer with consistent network commissions.', NOW()),

('c0000000-0000-0000-0000-000000000021', 'Sundance Productions', 'sundance-prod', 'Sundance Productions LLC', 'New York-based non-fiction and documentary film production studio founded by Robert Redford.', 'documentary', 2012, 'https://sundanceproductions.com', 'US', 'United States', 'New York', 10, 30, true, 79.00, 90.00, 72.00, 70.00, 80.00, 65.00, 75.00, 90.00, 'High-end American non-fiction and docu-series creator.', NOW()),

('c0000000-0000-0000-0000-000000000022', 'Kominami Films', 'kominami-films', 'Kominami Production S.A.R.L.', 'Boutique animation and visual effects production company.', 'animation', 2018, 'https://kominamifilms.com', 'FR', 'France', 'Annecy', 15, 40, true, 71.00, 82.00, 64.00, 75.00, 70.00, 49.00, 79.00, 84.00, 'French animation and post-vfx specialist studio.', NOW()),

('c0000000-0000-0000-0000-000000000023', 'Cineflix Media', 'cineflix-media', 'Cineflix Media Inc.', 'Leading Canadian independent media company producing unscripted and scripted series worldwide.', 'production_company', 1998, 'https://cineflix.com', 'CA', 'Canada', 'Montreal', 100, 300, true, 84.00, 76.00, 86.00, 78.00, 88.00, 60.00, 81.00, 91.00, 'Canadian global distributor and TV production studio.', NOW()),

('c0000000-0000-0000-0000-000000000024', 'Matchbox Pictures', 'matchbox-pictures', 'Matchbox Productions Pty Ltd', 'Australian film and television production company owned by Universal International Studios.', 'studio', 2008, 'https://matchboxpictures.com.au', 'AU', 'Australia', 'Melbourne', 30, 90, true, 83.00, 84.00, 81.00, 77.00, 82.00, 58.00, 84.00, 90.00, 'Top Australian drama and documentary producer backed by Universal.', NOW()),

('c0000000-0000-0000-0000-000000000025', 'Fabula', 'fabula', 'Fabula Productions S.A.', 'Academy Award-winning Chilean film and television production company founded by Pablo and Juan de Dios Larraín.', 'independent', 2004, 'https://fabula.cl', 'CL', 'Chile', 'Santiago', 25, 75, true, 89.00, 95.00, 84.00, 88.00, 92.00, 74.00, 93.00, 95.00, 'Premio Oscar winning Latin American independent studio producing international films.');

-- 4. INSERT COMPANY CATEGORIES
INSERT INTO company_categories (company_id, category) VALUES
('c0000000-0000-0000-0000-000000000001', 'film'),
('c0000000-0000-0000-0000-000000000001', 'television'),
('c0000000-0000-0000-0000-000000000001', 'postproduction'),
('c0000000-0000-0000-0000-000000000002', 'film'),
('c0000000-0000-0000-0000-000000000002', 'television'),
('c0000000-0000-0000-0000-000000000002', 'independent'),
('c0000000-0000-0000-0000-000000000003', 'film'),
('c0000000-0000-0000-0000-000000000003', 'television'),
('c0000000-0000-0000-0000-000000000003', 'international'),
('c0000000-0000-0000-0000-000000000004', 'television'),
('c0000000-0000-0000-0000-000000000004', 'studio'),
('c0000000-0000-0000-0000-000000000005', 'film'),
('c0000000-0000-0000-0000-000000000005', 'streaming'),
('c0000000-0000-0000-0000-000000000006', 'television'),
('c0000000-0000-0000-0000-000000000006', 'film'),
('c0000000-0000-0000-0000-000000000012', 'television'),
('c0000000-0000-0000-0000-000000000012', 'streaming'),
('c0000000-0000-0000-0000-000000000014', 'film'),
('c0000000-0000-0000-0000-000000000025', 'film'),
('c0000000-0000-0000-0000-000000000025', 'international');

-- 5. INSERT SOCIAL PROFILES
INSERT INTO social_profiles (company_id, platform, profile_url, username, follower_count, engagement_rate, posts_last_30_days, last_post_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'instagram', 'https://instagram.com/morenafilms', 'morenafilms', 24500, 3.4500, 14, NOW() - INTERVAL '2 days'),
('c0000000-0000-0000-0000-000000000001', 'linkedin', 'https://linkedin.com/company/morena-films', 'morena-films', 12800, 2.1000, 6, NOW() - INTERVAL '5 days'),
('c0000000-0000-0000-0000-000000000002', 'instagram', 'https://instagram.com/a24', 'a24', 1850000, 5.2000, 28, NOW() - INTERVAL '1 day'),
('c0000000-0000-0000-0000-000000000003', 'linkedin', 'https://linkedin.com/company/see-saw-films', 'see-saw-films', 35000, 3.8000, 8, NOW() - INTERVAL '3 days');

-- 6. INSERT PROJECTS
INSERT INTO projects (
  id, title, slug, project_type, status, release_date, country_code, genre, budget_min, budget_max, budget_currency, director_name, distributor, streaming_platform, description, source_id, announced_at
) VALUES
('p0000000-0000-0000-0000-000000000001', 'La Infiltrada', 'la-infiltrada', 'feature_film', 'production', '2025-10-15', 'ES', ARRAY['Thriller', 'Drama'], 4500000, 6000000, 'EUR', 'Arantxa Echevarría', 'Warner Bros. Spain', 'Prime Video', 'High-stakes undercover police thriller based on real events in Spain during the 1990s.', 's0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),

('p0000000-0000-0000-0000-000000000002', 'Civil War', 'civil-war', 'feature_film', 'released', '2024-04-12', 'US', ARRAY['Action', 'Sci-Fi', 'Drama'], 50000000, 50000000, 'USD', 'Alex Garland', 'A24', 'Max', 'A team of military-embedded journalists races across the US before rebel factions storm DC.', 's0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '300 days'),

('p0000000-0000-0000-0000-000000000003', 'Slow Horses Season 4', 'slow-horses-s4', 'tv_series', 'post_production', '2025-09-01', 'UK', ARRAY['Espionage', 'Thriller', 'Comedy'], 25000000, 35000000, 'GBP', 'Saul Metzstein', 'Apple TV+', 'Apple TV+', 'A dysfunctional team of MI5 agents navigate the espionage graveyard of Slough House.', 's0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '60 days'),

('p0000000-0000-0000-0000-000000000004', 'Costiera', 'costiera', 'tv_series', 'post_production', '2025-11-20', 'IT', ARRAY['Action', 'Drama'], 20000000, 30000000, 'EUR', 'Adam Bernstein', 'Fremantle', 'Amazon Prime', 'High-octane action drama series set on the Amalfi Coast of Italy.', 's0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '80 days'),

('p0000000-0000-0000-0000-000000000005', 'Lupin Season 4', 'lupin-s4', 'tv_series', 'pre_production', '2026-03-01', 'FR', ARRAY['Crime', 'Mystery'], 30000000, 40000000, 'EUR', 'Ludovic Bernard', 'Netflix', 'Netflix', 'The world famous gentleman burglar Assane Diop returns for a new high-stakes heist in Paris.', 's0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 days');

-- 7. INSERT COMPANY_PROJECTS
INSERT INTO company_projects (company_id, project_id, role) VALUES
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'production_company'),
('c0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'production_company'),
('c0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'producer'),
('c0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'producer'),
('c0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'production_company');

-- 8. INSERT PEOPLE
INSERT INTO people (
  id, full_name, first_name, last_name, job_title, linkedin_url, website_url, country_code, city, bio, profile_confidence
) VALUES
('per00000-0000-0000-0000-000000000001', 'Pedro Uriol', 'Pedro', 'Uriol', 'Head of Production & Producer', 'https://linkedin.com/in/pedro-uriol', 'https://morenafilms.com', 'ES', 'Madrid', 'Senior producer at Morena Films specializing in feature films and streaming thrillers.', 95.00),
('per00000-0000-0000-0000-000000000002', 'Álvaro Longoria', 'Álvaro', 'Longoria', 'Founder & Executive Producer', 'https://linkedin.com/in/alvaro-longoria', 'https://morenafilms.com', 'ES', 'Madrid', 'Co-founder of Morena Films and former President of the European Film Academy.', 98.00),
('per00000-0000-0000-0000-000000000003', 'Iain Canning', 'Iain', 'Canning', 'Co-Founder & Executive Producer', 'https://linkedin.com/in/iain-canning', 'https://see-saw-films.com', 'UK', 'London', 'Oscar-winning producer of The King’s Speech and Lion, co-founder of See-Saw Films.', 98.00),
('per00000-0000-0000-0000-000000000004', 'Samantha Waite', 'Samantha', 'Waite', 'Head of Post Production', 'https://linkedin.com/in/samantha-waite', 'https://fremantle.com', 'UK', 'London', 'Oversees high-end post production workflows and color finishing for Fremantle UK.', 96.00),
('per00000-0000-0000-0000-000000000005', 'Lorenzo Gangarossa', 'Lorenzo', 'Gangarossa', 'Head of Drama / Producer', 'https://linkedin.com/in/lorenzo-gangarossa', 'https://wildside.it', 'IT', 'Rome', 'Italian executive producer managing high-profile international co-productions.', 90.00);

-- 9. INSERT COMPANY_PEOPLE
INSERT INTO company_people (company_id, person_id, role, seniority, is_current, confidence) VALUES
('c0000000-0000-0000-0000-000000000001', 'per00000-0000-0000-0000-000000000001', 'head_of_production', 'Executive', true, 95.00),
('c0000000-0000-0000-0000-000000000001', 'per00000-0000-0000-0000-000000000002', 'founder', 'C-Level', true, 98.00),
('c0000000-0000-0000-0000-000000000003', 'per00000-0000-0000-0000-000000000003', 'founder', 'C-Level', true, 98.00),
('c0000000-0000-0000-0000-000000000004', 'per00000-0000-0000-0000-000000000004', 'head_of_post', 'Executive', true, 96.00),
('c0000000-0000-0000-0000-000000000006', 'per00000-0000-0000-0000-000000000005', 'producer', 'Senior', true, 90.00);

-- 10. INSERT COMPANY EVENTS
INSERT INTO company_events (company_id, event_type, title, description, importance_score, opportunity_score, source_id, event_date) VALUES
('c0000000-0000-0000-0000-000000000001', 'production_started', 'La Infiltrada Principal Photography Commenced', 'Morena Films has officially entered principal photography on feature thriller La Infiltrada in Madrid.', 85.00, 94.00, 's0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '40 days'),
('c0000000-0000-0000-0000-000000000003', 'post_production_started', 'Slow Horses S4 Enters Picture Lock & Post', 'See-Saw Films has transitioned Slow Horses Season 4 into picture post and finishing in London.', 90.00, 92.00, 's0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '25 days'),
('c0000000-0000-0000-0000-000000000006', 'funding', 'Wildside Secures Financing for New Series', 'Wildside has finalized international co-financing for upcoming Italian drama slate.', 80.00, 89.00, 's0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '15 days');

-- 11. INSERT COMPANY HISTORICAL SCORES
INSERT INTO company_scores (company_id, power_score, creative_score, commercial_score, momentum_score, international_score, social_score, mcl_match_score, score_version) VALUES
('c0000000-0000-0000-0000-000000000001', 88.50, 86.00, 90.00, 92.00, 85.00, 65.00, 94.00, 'v1'),
('c0000000-0000-0000-0000-000000000002', 96.00, 98.00, 94.00, 89.00, 90.00, 92.00, 88.00, 'v1'),
('c0000000-0000-0000-0000-000000000003', 92.00, 94.00, 89.00, 88.00, 93.00, 72.00, 92.50, 'v1');
