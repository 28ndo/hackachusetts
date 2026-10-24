# Hackachusetts tracks, challenges and resources

Extracted from the hackathon guide site (`hackathon webpage.js`, saved 2026-10-24). The site itself says these are guidance, not final ideas. Official details: https://massaicoalition.com/hackachusetts/

Each resource line: **name** (kind) — summary. *Useful for.* Link.

## Contents

- **Civic action**: V1 Simplified public services, V2 Responsive and resilient communities, V3 Safer and connected places, V4 Better college experiences, V5 Pathways to education and opportunity
- **Energy & climate tech**: C1 Resilient communities in a changing climate, C2 Cleaner, more affordable buildings, C3 A more reliable clean energy system, C4 Understanding and protecting the ocean, C5 Sustainable blue economy and coastal livelihoods
- **Healthcare & biotech**: H1 Turning wearable data into better healthcare, H2 Keeping residents connected to health coverage, H3 Improving healthcare access and coordination, H4 Accelerating biotechnology innovation, H5 Making clinical research more accessible
- **Robotics & hardware**: R1 Making automation accessible to manufacturers, R2 Robo-gym training environments, R3 Real-time control for data quality, R4 Swarm robotics for search and rescue, R5 The "Messy Desk" dynamic object sorting, R6 Safer inspection of critical infrastructure, R7 Path planning classifier

## Civic action

Strengthen the places, communities, and opportunities that shape daily life.

### Opportunity areas

**Better Together: Improving Where We Live, Work, Study & Play**  
Whether on a college campus or in a city or town, people encounter everyday challenges related to housing, transportation, public spaces, community connections, and access to opportunities. Technology can help improve these experiences and create stronger, more inclusive communities.  
*Explore better places to live, work, and study; stronger community connections and civic participation; and greater access to education, jobs, mentorship, financial resources, and other opportunities.*

**Citizen-Friendly Digital Government**  
Government services can be difficult to navigate. Residents and small businesses often face complex websites, lengthy PDFs, language barriers, and confusing application processes across multiple agencies. Massachusetts also has valuable public datasets that could be used to improve how services are delivered.  
*Explore AI agents to improve Mass.gov, accessible government documents, multilingual service navigation, simpler permitting and application processes, and GIS-powered solutions to community problems.*

**More Responsive Neighborhood Services**  
Cities receive reports about potholes, sanitation, streetlights, and other neighborhood concerns through systems such as 311. High volumes and repeated reports can make it hard to recognize patterns, prioritize action, and communicate progress.  
*Explore issue triage, geographic patterns, service transparency, and more accessible resident feedback.*

**Stronger Community Emergency Readiness**  
Severe weather and other disruptions require fast, clear communication among public agencies, community groups, and residents. Information may change quickly, and vulnerable populations can be hardest to reach.  
*Explore trusted alerts, local resource navigation, preparedness, and coordination without substituting for official emergency instructions.*

### Challenges

#### V1: Simplified public services

> One task. Too many sites and agencies. Plain language. Show the next step.

- **MassGIS environmental justice block groups** (dataset) — Block groups flagged for income, race, or language. *Equity context for services, neighborhoods, and alerts.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **Boston approved building permits** (dataset) — Issued since 2024. No street address. *Permitting volume, type, and ward.* https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20permitnumber%2Cworktype%2Cpermittypedescr%2Cdescription%2Cdeclared_valuation%2Ctotal_fees%2Cissued_date%2Cexpiration_date%2Cstatus%2Coccupancytype%2Csq_feet%2Czip%2Cward%20FROM%20%226ddcd912-32a0-43df-9908-63574f8c7e77%22%20WHERE%20issued_date%20%3E%3D%20%272024-01-01%27%20ORDER%20BY%20issued_date%20DESC%20LIMIT%20100
- **Boston neighborhood estimates, 2025** (dataset) — Population, education, poverty. City estimates. *Who lives where, before a service is designed.* https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20name%2Cyear%2Carealand_sqmi%2Cpopulation_b01001_001e%2Ceducation_b15003_hsgrad_and_ged%2Ceducation_b15003_022e%2Ceducation_b15003_gradprofdegree%2Cincome_b17001_001e%2Cincome_b17001_002e%20FROM%20%22b0543358-d03f-4682-bf0c-658ea4573d6f%22
- **Boston building and property violations** (dataset) — Status since 2024. No street address. *Where permits and inspections pile up.* https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20case_no%2Cstatus_dttm%2Cstatus%2Ccode%2Cvalue%2Cdescription%2Cviolation_city%2Cviolation_zip%2Cward%20FROM%20%22800a2663-1d6a-46e7-9356-bedb70f5332c%22%20WHERE%20status_dttm%20%3E%3D%20%272024-01-01%27%20ORDER%20BY%20status_dttm%20DESC%20LIMIT%20100
- **College Scorecard, Massachusetts** (dataset) — Cost, debt, earnings, and completion. Suppressed cells stay suppressed. *Comparing what a college costs and what students earn later.* https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_10152026.zip
- **O*NET occupations** (dataset) — Occupation titles and descriptions from O*NET 30.0. *Connecting a skill or a major to a career name.* https://www.onetcenter.org/dl_files/database/db_30_0_text/Occupation%20Data.txt
- **Boston Open Context** (tool) — Connect a model to city context. *Source-grounded civic agents.* https://github.com/CityOfBoston/OpenContext
- **Boston.gov** (guidance) — City services. *Authoritative service copy and process steps.* https://www.boston.gov/
- **Mass.gov** (guidance) — State services. *Statewide service navigation.* https://www.mass.gov/
- **Massachusetts 211** (guidance) — Referrals. *Local resource navigation in an emergency or service gap.* https://mass211.org/
- **Civic AI agents for Boston** (guidance) — How the city wants agents to identify themselves. *Identity and auth constraints for civic agents.* https://github.com/projnanda/civic-agents/blob/main/boston-agents-identity-and-auth.md
- **BLS occupational wages, Massachusetts** (guidance) — State wage tables. The file download blocked a scripted pull. *What an occupation pays here, before you recommend it.* https://www.bls.gov/oes/current/oes_ma.htm
- **Massachusetts E2C Hub** (guidance) — Directory of education and workforce files. Not one download. *Picking a state pathway dataset that matches the question.* https://www.mass.gov/info-details/e2c-hub-directory-of-datasets-and-reports
- **Massachusetts college and career outcomes** (guidance) — Dashboard of enrollment after high school. *Where college-going pathways diverge.* https://www.mass.gov/info-details/massachusetts-college-and-career-outcomes-dashboard
- **American Community Survey** (guidance) — Income, education, and commuting. A Census key is required, so there is no zip. *Neighborhood context around a campus. Mind the margin of error.* https://data.census.gov/
- **College Navigator** (guidance) — Federal institution profiles. Use IPEDS for the bulk file. *Checking one college before you generalize.* https://nces.ed.gov/collegenavigator/
- **U.S. News college rankings** (guidance) — Published ranks. Not an open bulk file. Do not scrape it. *Setting a ranking next to cost and earnings.* https://www.usnews.com/best-colleges/rankings
- **Times Higher Education rankings** (guidance) — Global ranks. Licensed. Not a starter zip. *Showing how a global rank is built.* https://www.timeshighereducation.com/world-university-rankings
- **QS subject rankings** (guidance) — Subject ranks. Not an open bulk file. *Comparing a department rank with the institution rank.* https://www.topuniversities.com/subject-rankings
- **ShanghaiRanking ARWU** (guidance) — Research-weighted ranks. Not an open bulk file. *Setting a research rank next to student outcomes.* https://www.shanghairanking.com/rankings/arwu/2026
- **Public college enrollment, fall 2021** (guidance) — Headcount for community colleges and state universities. The 2020 edition is the older twin. *Seeing which public campuses grew or shrank before you design for them.* https://www.mass.edu/datacenter/2021enrollmentestimates.asp
- **Access and affordability at public colleges** (guidance) — Enrollment by demographic and income at state universities and community colleges. *Who can actually get in, and who the price leaves out.* https://www.mass.edu/datacenter/access/home.asp
- **Tuition and fees at Massachusetts public colleges** (guidance) — Published tuition and fees. Not a net-price estimate. *The sticker a student sees before aid.* https://www.mass.edu/datacenter/tuition/home.asp
- **Student success at public colleges** (guidance) — Completion at state universities and community colleges. *Whether a campus finishes what it starts.* https://www.mass.edu/datacenter/success/home.asp
- **Adult learners at public colleges** (guidance) — Who is already enrolled later in life, and what stops others. *A pathway tool that is not only for 18-year-olds.* https://www.mass.edu/datacenter/2017adultlearners.asp
- **Massachusetts school and district profiles** (guidance) — Enrollment, graduation, teacher pay, and finance by school and district. *The K–12 side of a campus-to-career story.* https://profiles.doe.mass.edu/
- **Elementary and secondary statistical reports** (guidance) — Graduation, dropout, retention, educator evaluation, and mobility. *A district number you can cite instead of a statewide average.* https://www.doe.mass.edu/infoservices/reports/default.html
- **MCAS results** (guidance) — Assessment results for the last six years. A score is not a student. *Where a district’s academic picture is public.* https://www.doe.mass.edu/mcas/results.html
- **Career and vocational technical education data** (guidance) — Reports for high-school and two-year career programs. *A path that is not a four-year college.* https://www.doe.mass.edu/ccte/data-reports/default.html
- **Charter school finance and enrollment** (guidance) — Funding, spending, tuition, and enrollment for charter schools. *Comparing a charter with the district next to it.* https://www.doe.mass.edu/charter/finance/default.html
- **Special education tuition rates** (guidance) — Approved tuition prices for special-education programs. *What a placement costs the district, in the state’s own table.* https://www.mass.gov/info-details/special-education-tuition-pricing-details
- **Massachusetts STEM dashboard** (guidance) — The state’s STEM indicators. A dashboard, not a bulk extract. *Where the science and tech pipeline is thin.* https://www.mass.gov/info-details/stem-dashboard
- **DESE research and evaluations** (guidance) — Policy briefs, program evaluations, and legislative reports. *Reading what the state already measured before you invent a metric.* https://www.doe.mass.edu/research/reports/default.aspx

#### V2: Responsive and resilient communities

> Volume hides who is waiting, and who an alert misses. Triage the pattern. Prep is not a siren.

- **Boston 311 service requests** (dataset) — Topic, department, status, neighborhood. No street address. *Neighborhood service patterns and triage.* https://data.boston.gov/api/3/action/datastore_search?resource_id=254adca6-64ab-4c5c-9fc0-a6da622be185&fields=open_date,case_topic,service_name,assigned_department,case_status,neighborhood,zip_code,on_time,city_council_district,ward&sort=open_date%20desc&limit=100
- **MassGIS environmental justice block groups** (dataset) — Block groups flagged for income, race, or language. *Equity context for services, neighborhoods, and alerts.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **OpenFEMA disaster declarations** (api) — Massachusetts declarations. *Emergency readiness and disaster history.* https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20%27MA%27&$top=100&$select=disasterNumber,declarationTitle,declarationDate,incidentType,designatedArea,declarationType&$orderby=declarationDate%20desc
- **IPEDS institutional directory, Massachusetts** (dataset) — Every Massachusetts institution in the 2024 IPEDS directory. *A fact book of campuses, sector, and size.* https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip
- **OpenAlex works at the nine campuses, 2024** (api) — Most-cited 2024 works with an author at a Hackachusetts campus. *Finding research already happening where students are.* https://api.openalex.org/works?filter=authorships.institutions.id:I63966007%7CI136199984%7CI103531236%7CI111088046%7CI12912129%7CI24603500%7CI133738476%7CI33434090%7CI96062909,publication_year:2024&sort=cited_by_count:desc&per_page=25&select=display_name,publication_year,cited_by_count,type,primary_location
- **Boston Open Context** (tool) — Connect a model to city context. *Source-grounded civic agents.* https://github.com/CityOfBoston/OpenContext
- **Massachusetts 211** (guidance) — Referrals. *Local resource navigation in an emergency or service gap.* https://mass211.org/
- **NSSE public displays** (guidance) — Aggregate engagement displays. Student microdata is restricted. *Belonging and engagement, without pretending you have the survey.* https://nsse.indiana.edu/nsse/reports-data/data-displays.html
- **Massachusetts public higher education performance** (guidance) — Performance reports for public colleges. Private colleges are out of scope. *Benchmarking a public campus before you build on it.* https://www.mass.edu/datacenter/PMRS/home.asp
- **College equity by place and income** (guidance) — Attainment and earnings gaps by ZIP code among Massachusetts adults. *A neighborhood where a degree is rare, and what that costs.* https://www.mass.edu/datacenter/EquitySpotlight-GeographySES.asp
- **College equity by race and gender** (guidance) — Outcome gaps the Board of Higher Education asked the state to close. *A completion number that is not one statewide average.* https://www.mass.edu/datacenter/equityspotlight-latinomales.asp
- **Pandemic enrollment changes by population** (guidance) — Who left public colleges when the pandemic hit, by race and other traits. *A drop that a campus average will hide.* https://www.mass.edu/datacenter/2020enrollmenttrends.asp
- **PMRS spotlight on success and completion** (guidance) — Rising completion, and the gaps that stayed. One report inside PMRS. *The specific gap, not only the campus dashboard.* https://www.mass.edu/datacenter/pmrs/reports/2019/Success-Completion.asp
- **Special education disputes and rejected IEPs** (guidance) — Yearly counts of rejected plans, mediations, and hearings. Not student records. *Where a plan broke down before anyone reached a campus.* https://www.mass.gov/data-on-special-education-disputes-rejected-individualized-education-programs-ieps
- **Massachusetts youth risk behavior survey** (guidance) — Statewide risk behaviors among public high school students. Not a student file. *What a high-school community is already dealing with.* https://www.doe.mass.edu/sfs/yrbs/
- **Web of Science API** (guidance) — Citation index. Access may require a subscription. *Collaboration questions OpenAlex cannot answer alone.* https://developer.clarivate.com/apis/wos
- **Google Scholar** (guidance) — Search. There is no public API. Do not scrape it. *Reading the literature behind a campus project.* https://scholar.google.com/

#### V3: Safer and connected places

> The last mile is a street, a bike, or a crash. Show what changed, and where it is unsafe.

- **MBTA service alerts** (api) — Effect, severity, routes, rider text. *Disruption communication and trip decisions.* https://api-v3.mbta.com/alerts?page%5Blimit%5D=50
- **MBTA subway routes** (api) — Subway and light rail. *Transit navigation and routing context.* https://api-v3.mbta.com/routes?filter%5Btype%5D=0,1
- **MBTA rapid transit stations** (dataset) — Station and line. No geometry. *Station-level transit context on a map.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/MBTA_Rapid_Transit/MapServer/0/query?where=1%3D1&outFields=STATION,LINE,ROUTE&returnGeometry=false&f=json
- **MassGIS colleges and universities** (dataset) — Campus points statewide. Street address and phone are left out. *Seeing which campuses a bus, a bike, or a service can reach.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/HigherEd/MapServer/0/query?where=1%3D1&outFields=COLLEGE,CAMPUS,CITY,ZIPCODE,GEOG_TOWN,TYPE,NCES_TYPE,CATEGORY,CAMPUSHOUS&returnGeometry=true&outSR=4326&f=json
- **Bluebikes trips, November 2024** (dataset) — Station-to-station counts for one month. The URL is every trip. *Where shared bikes actually move around campus.* https://s3.amazonaws.com/hubway-data/202411-bluebikes-tripdata.zip
- **Boston Vision Zero crash records** (dataset) — Mode, street, and cross street. The city's crash point, not a home. *Finding injury patterns near a campus or a bike route.* https://data.boston.gov/api/3/action/datastore_search?resource_id=e4bfe397-6bfc-49c5-9367-c879fac7401d&fields=dispatch_ts,mode_type,location_type,street,xstreet1,xstreet2,lat,long&sort=dispatch_ts%20desc&limit=100
- **Cambridge police crash records** (dataset) — Street and crash type. No house number, plate, age, or sex. *Intersections where people walking or biking get hit.* https://data.cambridgema.gov/resource/gb5w-yva3.json?$select=date_time,day_of_week,street_name,cross_street,near_street,location,may_involve_cyclist,may_involve_pedestrian,manner_of_collision,first_harmful_event,ambient_light,weather_condition_1,road_surface_condition,speed_limit,street_or_intersection&$order=date_time%20DESC&$limit=100
- **Cambridge citywide bicycle counts** (dataset) — Counts since 2018 at named locations. *Which streets already carry bike traffic.* https://data.cambridgema.gov/resource/ijm6-q7em.json?$select=countlocation,year,date,timeperiod,street,trafficdirection,cyclistlocation,movementtype,count,weather,latitude,longitude&$where=year%20%3E=%20%272018%27&$order=date%20DESC&$limit=100
- **Cambridge Broadway bicycle counter** (dataset) — Automated Broadway counts from 2024 on. *Season and time of day on one real bike street.* https://data.cambridgema.gov/resource/q8v9-mcfg.json?$select=datetime,day,total,entries,exits&$where=datetime%20%3E=%20%272024-01-01T00:00:00%27&$order=datetime%20DESC&$limit=100
- **Cambridge Fresh Pond usership** (dataset) — Hourly use of the reservation from 2024 on. *How a shared outdoor place is actually used.* https://data.cambridgema.gov/resource/6xy8-cstb.json?$select=datetime,season,month,hour,fp_avg_hrly_use,bn,cg,lfp,lus,pro_shop&$where=year%20%3E=%20%272024%27&$order=datetime%20DESC&$limit=100
- **Somerville bicycle and pedestrian counts** (dataset) — Bike and walk counts at named intersections. *A campus-to-neighborhood walking or biking route.* https://data.somervillema.gov/resource/qu9x-4xq5.json?$select=year,location_name,latitude,longitude,am_pm,mode,count&$order=year%20DESC&$limit=100
- **Boston Numina street sensors** (dataset) — Pedestrian and other street counts from the published sensors. *Who is using a shared street, hour by hour.* https://data.boston.gov/api/3/action/datastore_search?resource_id=d6c06150-418d-4705-b0c9-e92afd23ede7&fields=zone_id,metric,objClass,result,time&limit=100
- **Boston bicycle count dashboard** (guidance) — City bike-count charts. Confirm an export before you depend on one. *Checking a corridor the sensor table does not cover.* https://www.arcgis.com/apps/dashboards/3491f78e46a545fe8186ad70ebe897aa
- **MassDOT traffic count dashboard** (guidance) — Statewide count stations. Exports vary by station. *Traffic next to a campus outside Boston.* https://mhd.ms2soft.com/tdms.ui/nmds/dashboard?loc=mhd
- **Boston region bike and pedestrian counts** (guidance) — Regional count map. Download options vary. *Active-transportation counts beyond one city.* https://bostonmpo.org/geoserver/www/apps/bp-counts-app-01262024/index.html
- **MassDOT crash portal** (guidance) — Statewide crash records. Not the same definitions as Vision Zero. *A crash outside Boston. Watch geocoding gaps and duplicates.* https://apps.crashdata.dot.mass.gov/cdp/home
- **OpenStreetMap** (tool) — Roads, paths, and amenities. Completeness varies. Attribute the map. *A walking or biking path when the city file stops.* https://www.openstreetmap.org/
- **How Boston counts people biking** (guidance) — An explainer of local bike counts. Not a dataset. *Saying what a counter can and cannot see.* https://bostoncyclistsunion.org/how-does-boston-know-when-and-where-people-are-biking
- **Massachusetts crash data background** (guidance) — Why city and state crash files do not match. *Writing the limitation into a safety demo.* https://docs.google.com/document/d/1uXopTPMfoXXUVYxw3qVNQyWBeCKVfKLmRSZtwE6gJOc/edit

#### V4: Better college experiences

> Create more supportive college experiences. Show the campus, the engagement, and the research.

- **IPEDS institutional directory, Massachusetts** (dataset) — Every Massachusetts institution in the 2024 IPEDS directory. *A fact book of campuses, sector, and size.* https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip
- **OpenAlex works at the nine campuses, 2024** (api) — Most-cited 2024 works with an author at a Hackachusetts campus. *Finding research already happening where students are.* https://api.openalex.org/works?filter=authorships.institutions.id:I63966007%7CI136199984%7CI103531236%7CI111088046%7CI12912129%7CI24603500%7CI133738476%7CI33434090%7CI96062909,publication_year:2024&sort=cited_by_count:desc&per_page=25&select=display_name,publication_year,cited_by_count,type,primary_location
- **NSSE public displays** (guidance) — Aggregate engagement displays. Student microdata is restricted. *Belonging and engagement, without pretending you have the survey.* https://nsse.indiana.edu/nsse/reports-data/data-displays.html
- **Massachusetts public higher education performance** (guidance) — Performance reports for public colleges. Private colleges are out of scope. *Benchmarking a public campus before you build on it.* https://www.mass.edu/datacenter/PMRS/home.asp
- **Web of Science API** (guidance) — Citation index. Access may require a subscription. *Collaboration questions OpenAlex cannot answer alone.* https://developer.clarivate.com/apis/wos
- **Google Scholar** (guidance) — Search. There is no public API. Do not scrape it. *Reading the literature behind a campus project.* https://scholar.google.com/

#### V5: Pathways to education and opportunity

> Expand access to life-changing opportunities. Cost, wages, and the next step.

- **College Scorecard, Massachusetts** (dataset) — Cost, debt, earnings, and completion. Suppressed cells stay suppressed. *Comparing what a college costs and what students earn later.* https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_10152026.zip
- **O*NET occupations** (dataset) — Occupation titles and descriptions from O*NET 30.0. *Connecting a skill or a major to a career name.* https://www.onetcenter.org/dl_files/database/db_30_0_text/Occupation%20Data.txt
- **IPEDS institutional directory, Massachusetts** (dataset) — Every Massachusetts institution in the 2024 IPEDS directory. *A fact book of campuses, sector, and size.* https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip
- **BLS occupational wages, Massachusetts** (guidance) — State wage tables. The file download blocked a scripted pull. *What an occupation pays here, before you recommend it.* https://www.bls.gov/oes/current/oes_ma.htm
- **Massachusetts E2C Hub** (guidance) — Directory of education and workforce files. Not one download. *Picking a state pathway dataset that matches the question.* https://www.mass.gov/info-details/e2c-hub-directory-of-datasets-and-reports
- **Massachusetts college and career outcomes** (guidance) — Dashboard of enrollment after high school. *Where college-going pathways diverge.* https://www.mass.gov/info-details/massachusetts-college-and-career-outcomes-dashboard
- **American Community Survey** (guidance) — Income, education, and commuting. A Census key is required, so there is no zip. *Neighborhood context around a campus. Mind the margin of error.* https://data.census.gov/
- **College Navigator** (guidance) — Federal institution profiles. Use IPEDS for the bulk file. *Checking one college before you generalize.* https://nces.ed.gov/collegenavigator/
- **U.S. News college rankings** (guidance) — Published ranks. Not an open bulk file. Do not scrape it. *Setting a ranking next to cost and earnings.* https://www.usnews.com/best-colleges/rankings
- **Times Higher Education rankings** (guidance) — Global ranks. Licensed. Not a starter zip. *Showing how a global rank is built.* https://www.timeshighereducation.com/world-university-rankings
- **QS subject rankings** (guidance) — Subject ranks. Not an open bulk file. *Comparing a department rank with the institution rank.* https://www.topuniversities.com/subject-rankings
- **ShanghaiRanking ARWU** (guidance) — Research-weighted ranks. Not an open bulk file. *Setting a research rank next to student outcomes.* https://www.shanghairanking.com/rankings/arwu/2026

### Track-wide resources

- **Boston Open Data** (guidance) — 311, transportation, and city operations datasets. *311, transportation, and city operations datasets.* https://data.boston.gov/
- **MassGIS** (guidance) — Community boundaries, infrastructure, and geospatial data. Instant download after submitting the form. *Geospatial data, infrastructure, and community analysis.* https://www.mass.gov/info-details/massgis-data-layers
- **Cambridge Open Data** (guidance) — Local government, transportation, housing, and community datasets. *City datasets on housing, transportation, community services, and local government.* https://data.cambridgema.gov/browse
- **MBTA V3 API** (api) — Public transit routes, schedules, and alerts. *Public transit routes, schedules, and alerts.* https://api-v3.mbta.com/
- **Google Data Commons MCP** (tool) — Connecting AI agents to public statistical datasets. *Connecting AI agents to public statistical datasets.* https://developers.googleblog.com/en/datacommonsmcp/
- **NANDA Town** (tool) — Research environment for autonomous AI agent interactions. *Research environment for autonomous AI agent interactions.* https://nandatown.projectnanda.org/
- **FEMA OpenFEMA** (guidance) — Emergency management and disaster data. *Emergency management and disaster data.* https://www.fema.gov/about/openfema
- **Additional Civic Action Resources** (guidance) — Supplementary tools, datasets, and references for participants. *Supplementary tools, datasets, and references for participants.* https://docs.google.com/document/d/1SNUjxvBK5cCq273aYCceGPGKflVUCUF_zrxGw741kAs/edit

## Energy & climate tech

Tackle how we power our world and protect our planet.

### Opportunity areas

**Resilient communities in a changing climate**  
Massachusetts faces growing exposure to extreme heat, inland and coastal flooding, and intense storms. Risks differ by neighborhood, infrastructure condition, geography, and household resources, making it difficult for communities to prioritize preparedness investments.  
*Explore localized risk understanding, preparedness, infrastructure vulnerability, equitable adaptation, and communication of uncertainty.*

**Cleaner, more affordable buildings**  
Buildings are central to Massachusetts energy consumption and decarbonization efforts. Older building stock, up-front retrofit costs, and uneven access to efficiency programs can complicate progress while residents and businesses face affordability pressures.  
*Explore energy waste, retrofit prioritization, building performance, tenant and owner incentives, and access to energy savings.*

**A more reliable clean energy system**  
Electrification, new clean generation, and changing electricity demand are reshaping the New England grid. Massachusetts needs reliable power during peaks and severe weather while integrating renewables and managing costs.  
*Explore demand flexibility, storage, distributed energy, grid visibility, resilience, and tradeoffs between affordability and decarbonization.*

**Understanding and protecting the ocean**  
Warming waters, storms, and changing ocean conditions affect marine habitats, fisheries, and coastal communities. Observations from fishing vessels, buoys, gliders, surveys, and satellites reveal different parts of the ocean, but these measurements can be difficult to combine and interpret. Recent eMOLT updates describe storm-related mixing of ocean layers, changes in bottom temperature and dissolved oxygen, and harmful algal bloom monitoring. Better access to trustworthy observations and forecasts could help communities understand environmental changes and emerging risks.  
*Explore access to ocean observations, trends in bottom temperature and dissolved oxygen, algal blooms, data gaps, comparisons between observations and model forecasts, and communication of uncertainty to fishermen, researchers, and coastal communities.*

**Sustainable blue economy and coastal livelihoods**  
Massachusetts coastal economies depend on commercial fishing, aquaculture, maritime transportation, and emerging offshore energy. These industries share ocean space while facing shifting species distributions, water conditions, ecosystem pressures, and economic uncertainty. Fishing vessels also contribute valuable environmental observations, creating opportunities for stronger connections between working waterfronts, researchers, and ocean planning.  
*Explore sustainable fisheries and aquaculture, impacts of changing bottom temperatures, ocean-space planning, port operations, environmental monitoring for working waterfronts, and balancing economic livelihoods with ecosystem protection.*

### Challenges

#### C1: Resilient communities in a changing climate

> Heat, flood, and storm risk is local. Local risk.

- **NOAA buoy 44013, Boston** (dataset) — Boston buoy. Wind, waves, water temperature. *Coastal conditions and ocean observation.* https://www.ndbc.noaa.gov/data/realtime2/44013.txt
- **NOAA Boston tide gauge** (dataset) — Hourly water level, August 2024. *Harbor level against a storm or a forecast.* https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20240801&end_date=20240831&station=8443970&product=hourly_height&datum=MLLW&units=metric&time_zone=gmt&format=json
- **USGS Charles River at Waltham** (dataset) — Daily discharge, 2024. *River flow for flood and heat context.* https://waterservices.usgs.gov/nwis/dv/?format=json&sites=01104500&parameterCd=00060&startDT=2024-01-01&endDT=2024-12-31
- **MassGIS environmental justice block groups** (dataset) — Who carries more of the risk. *Equitable adaptation and who faces localized risk.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **Massachusetts Climate Change Assessment** (guidance) — What the state already ranks. *Which hazards and sectors the state already ranks.* https://www.mass.gov/info-details/massachusetts-climate-change-assessment
- **ResilientMass** (guidance) — Municipal adaptation plans. *Community preparedness and municipal plans.* https://resilient.mass.gov/
- **NOAA Digital Coast** (guidance) — Flooding and sea level. *Flooding and shoreline risk.* https://coast.noaa.gov/digitalcoast/
- **MassGIS data layers** (guidance) — Flood, land use, environmental justice, and coastal layers. *Flood, land use, environmental justice, and coastal layers.* https://www.mass.gov/info-details/massgis-data-layers
- **NOAA National Data Buoy Center** (guidance) — Find a buoy. Waves, wind, and water temperature. *Ocean observations including waves and temperature.* https://www.ndbc.noaa.gov/

#### C2: Cleaner, more affordable buildings

> Old buildings. High bills. Slow retrofits. What to retrofit first.

- **Boston BERDO reporting, 2021** (dataset) — Building energy and emissions. No street address. *Building performance and retrofit priority.* https://data.boston.gov/api/3/action/datastore_search?resource_id=43e4abc9-1fae-40d9-a02e-ff950bd0e732&fields=Property_Type,Zip,Year_Built,Gross_Area_sf,Site_EUI_kBtuft2,ENERGY_STAR_Score,GHG_Emissions_MTCO2e,GHG_Intensity_kgCO2sf,per_Electricity,per_Gas&limit=100
- **Renewables at Massachusetts landfills** (dataset) — Solar and other projects. Megawatts. No street address. *Where closed landfills already host generation.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/DEP/RenewablesAtMaLandfills/MapServer/0/query?where=1%3D1&outFields=MUNICIPALITY,FACILITY,TYPE_,MW_PERMITTED,MW_OPERATING,STATUS_1,OPERATING_SINCE&returnGeometry=false&f=json
- **Massachusetts energy data** (guidance) — Use, generation, emissions. *Buildings and the clean energy system.* https://www.mass.gov/massachusetts-energy-data
- **Mass Save data** (guidance) — Who actually got the rebate. *Who is reaching efficiency programs.* https://www.masssave.com/about/mass-save-data

#### C3: A more reliable clean energy system

> Clean power still has to show up at the peak. Load, storage, cost.

- **Renewables at Massachusetts landfills** (dataset) — Solar and other projects. Megawatts. No street address. *Where closed landfills already host generation.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/DEP/RenewablesAtMaLandfills/MapServer/0/query?where=1%3D1&outFields=MUNICIPALITY,FACILITY,TYPE_,MW_PERMITTED,MW_OPERATING,STATUS_1,OPERATING_SINCE&returnGeometry=false&f=json
- **Electric utility by town** (dataset) — Which utility serves each Massachusetts town. *Who has to deliver the power.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ElectricityProviders/MapServer/0/query?where=1%3D1&outFields=TOWN,ELEC,ELEC_LABEL&returnGeometry=false&f=json
- **Transmission lines crossing Massachusetts** (dataset) — Owner, voltage, status. No geometry. *The lines between a plant and a town.* https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Electric_Power_Transmission_Lines/FeatureServer/0/query?geometry=-73.5081%2C41.1870%2C-69.9284%2C42.8868&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OWNER,VOLTAGE,VOLT_CLASS,TYPE,STATUS&returnGeometry=false&resultRecordCount=100&f=json
- **Massachusetts energy data** (guidance) — Use, generation, emissions. *Buildings and the clean energy system.* https://www.mass.gov/massachusetts-energy-data
- **ISO New England ISO Express** (guidance) — Demand, mix, price. No public bulk download. *Grid load, fuel mix, and price context.* https://www.iso-ne.com/isoexpress/
- **Open Data on AWS** (guidance) — NOAA, USGS, and climate archives, already on AWS. *The same agencies, when the file is too big for a laptop.* https://registry.opendata.aws/collab/asdi/

#### C4: Understanding and protecting the ocean

> Buoys, boats, and satellites each see a slice. Compare the forecast to the boat.

- **eMOLT bottom temperature** (dataset) — Anonymized boat data. This file is one week of bottom temperature. *Historical bottom-temperature trends and mapping. The full table also has vertical profiles.* https://erddap.ondeckdata.com/erddap/tabledap/emolt_data.csv?time,latitude,longitude,depth,temperature&time%3E=2024-08-01T00:00:00Z&time%3C=2024-08-08T00:00:00Z
- **NOAA buoy 44013, Boston** (dataset) — Boston buoy. Wind, waves, water temperature. *Coastal conditions and ocean observation.* https://www.ndbc.noaa.gov/data/realtime2/44013.txt
- **NOAA Boston tide gauge** (dataset) — Hourly water level, August 2024. *Harbor level against a storm or a forecast.* https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20240801&end_date=20240831&station=8443970&product=hourly_height&datum=MLLW&units=metric&time_zone=gmt&format=json
- **Diadromous fish monitoring stations** (dataset) — River, town, station type. No street address. *Where the state's fish runs are watched.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/DiadromousFish/MapServer/0/query?where=1%3D1&outFields=RIVER,STATION_TYPE,TOWN,YEAR_INSTALLED,HAS_TEMP_LOGGER,HAS_WATER_CHEMISTRY_STATION&returnGeometry=false&f=json
- **Northeast Ocean Data Portal** (guidance) — Who uses which piece of ocean. *Ocean-space planning and overlapping uses.* https://www.northeastoceandata.org/
- **NOAA Digital Coast** (guidance) — Flooding and sea level. *Flooding and shoreline risk.* https://coast.noaa.gov/digitalcoast/
- **FIShBOT bottom temperature** (guidance) — Daily bottom temperature on a roughly 7 km grid. Mean, spread, and observation counts. *A grid that combines eMOLT, gliders, buoys, surveys, and other sources.* https://github.com/CommercialFisheriesResearchFoundation/fishbot/blob/main/README.md
- **Cape Cod Ocean Watch** (guidance) — Regional ocean view from WHOI. *Exploring conditions before downloading tables.* https://ccocean.whoi.edu/
- **Commercial Fisheries Research Foundation ERDDAP** (api) — FIShBOT and cooperative fisheries observations, as an API. *Programmatic comparisons across fisheries observations.* https://erddap.cfrfoundation.org/erddap/
- **NASA PACE ocean color** (guidance) — Ocean color and chlorophyll. Not a toxin reading. *Plankton-bloom exploration alongside in-water data.* https://pace.oceansciences.org/
- **WHOI HABhub** (guidance) — Harmful algal bloom context. *Interpreting satellite and in-water bloom signals.* https://habhub.whoi.edu/
- **NOAA National Data Buoy Center** (guidance) — Find a buoy. Waves, wind, and water temperature. *Ocean observations including waves and temperature.* https://www.ndbc.noaa.gov/
- **ERDDAP documentation** (guidance) — How to query and download an ERDDAP table. *API-style access. Python and R clients can simplify the query.* https://erddap.github.io/
- **Doppio ocean model** (guidance) — A ROMS model run. Not a buoy reading. Confirm the file and the forecast horizon. *Comparing a forecast with measured conditions.* https://tds.marine.rutgers.edu/thredds/catalog/roms/doppio/2017_da/his/runs/catalog.html
- **NECOFS FVCOM forecast** (guidance) — Northeast coastal forecast from UMass Dartmouth. A model, not a measurement. *Comparing a regional forecast with a buoy, a tide gauge, or eMOLT.* http://www.smast.umassd.edu:8080/thredds/dodsC/models/fvcom/NECOFS/Forecasts/NECOFS_FVCOM_OCEAN_NORTHEAST_FORECAST.nc.html
- **MOM6 Northwest Atlantic** (guidance) — NOAA regional ocean model. Not a direct observation. *Comparing modeled conditions with measured temperature and oxygen.* https://psl.noaa.gov/thredds/catalog/Projects/CEFI/regional_mom6/cefi_portal/northwest_atlantic/full_domain/catalog.html

#### C5: Sustainable blue economy and coastal livelihoods

> Fishing, ports, and offshore energy share one ocean. Livelihoods and the water.

- **eMOLT bottom temperature** (dataset) — Anonymized boat data. This file is one week of bottom temperature. *Historical bottom-temperature trends and mapping. The full table also has vertical profiles.* https://erddap.ondeckdata.com/erddap/tabledap/emolt_data.csv?time,latitude,longitude,depth,temperature&time%3E=2024-08-01T00:00:00Z&time%3C=2024-08-08T00:00:00Z
- **Diadromous fish monitoring stations** (dataset) — River, town, station type. No street address. *Where the state's fish runs are watched.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/DiadromousFish/MapServer/0/query?where=1%3D1&outFields=RIVER,STATION_TYPE,TOWN,YEAR_INSTALLED,HAS_TEMP_LOGGER,HAS_WATER_CHEMISTRY_STATION&returnGeometry=false&f=json
- **Northeast Ocean Data Portal** (guidance) — Who uses which piece of ocean. *Ocean-space planning and overlapping uses.* https://www.northeastoceandata.org/
- **FIShBOT bottom temperature** (guidance) — Daily bottom temperature on a roughly 7 km grid. Mean, spread, and observation counts. *A grid that combines eMOLT, gliders, buoys, surveys, and other sources.* https://github.com/CommercialFisheriesResearchFoundation/fishbot/blob/main/README.md
- **Cape Cod Ocean Watch** (guidance) — Regional ocean view from WHOI. *Exploring conditions before downloading tables.* https://ccocean.whoi.edu/
- **Commercial Fisheries Research Foundation ERDDAP** (api) — FIShBOT and cooperative fisheries observations, as an API. *Programmatic comparisons across fisheries observations.* https://erddap.cfrfoundation.org/erddap/
- **ERDDAP documentation** (guidance) — How to query and download an ERDDAP table. *API-style access. Python and R clients can simplify the query.* https://erddap.github.io/

## Healthcare & biotech

Turn continuous data, coverage, and research into better care.

### Opportunity areas

**Turning Wearable Data into Better Healthcare**  
Wearable devices are generating increasingly detailed health information beyond traditional clinical settings. However, turning continuous monitoring into meaningful insights and better care remains a challenge. Opportunities exist to connect wearable technology, AI, patients, and healthcare providers to support more personalized, preventive, and accessible healthcare.  
*Explore personalized health insights, preventive care, early identification of health risks, patient engagement, integration of wearable and clinical data, and new models for connected healthcare. Consider how these technologies could support better care while keeping clinical decisions with qualified professionals.*

**Keeping Residents Connected to Health Coverage**  
MassHealth renewal can involve multiple organizations, incomplete or outdated records, and notices that do not reach the people who need to respond. Upcoming changes to renewal frequency and participation requirements heighten the importance of making this process understandable and coordinated. Coverage interruptions can affect medication access, appointments, and continuity of treatment.  
*Consider information gaps, accessible communication, timely assistance, and coordination among members, MassHealth, health centers, and community partners. The state remains responsible for eligibility decisions.*

**Improving Healthcare Access and Coordination**  
Patients and healthcare providers face challenges navigating disconnected systems, referrals, scheduling, and administrative processes. These barriers are especially significant in rural communities, where long travel distances, limited specialty care, and transportation difficulties can prevent patients from receiving timely treatment. A referral may be sent without an appointment being scheduled, or a specialist visit may occur without the treatment plan reaching the primary-care team. Improving access requires connecting the entire care journey, not just finding a provider.  
*Explore rural specialty-care access, referral coordination, appointment scheduling, transportation, telehealth, insurance coverage constraints, administrative automation, and better communication between patients, specialists, and primary-care teams. Clinical decisions remain with qualified professionals.*

**Accelerating Biotechnology Innovation**  
Massachusetts is a global hub for biotechnology and life sciences, but developing new medicines, engineering biological systems, and translating scientific discoveries into real-world applications remain complex, expensive, and time-consuming. AI creates opportunities to accelerate research, experimentation, and biotechnology development.  
*Explore AI-powered drug discovery, protein design, genomics, synthetic biology, biomarker discovery, laboratory automation, biomanufacturing, and tools that make biotechnology research faster, more accessible, and efficient.*

**Making Clinical Research More Accessible**  
Massachusetts hospitals and universities conduct clinical research, yet finding an appropriate study and understanding participation can be difficult for patients and referring clinicians. Eligibility information can be technical, and access may differ by language, geography, and transportation.  
*Explore AI-powered clinical trial discovery, simplified research information, multilingual access, participant navigation, and tools that help researchers connect with potential participants while respecting privacy and informed consent.*

### Challenges

#### H1: Turning wearable data into better healthcare

> Continuous monitoring is not yet better care. Insights, early risk, and wearable data next to the chart. Clinicians decide.

- **CDC PLACES short sleep** (dataset) — Adults sleeping under 7 hours, by county. *A public sleep baseline. Not a wearable feed.* https://data.cdc.gov/resource/swc5-untb.json?$select=year,locationname,data_value,low_confidence_limit,high_confidence_limit,totalpopulation&stateabbr=MA&measure=Short%20sleep%20duration%20among%20adults&data_value_type=Crude%20prevalence&$limit=50
- **WHOOP developer API** (guidance) — Recovery, sleep, strain. Member consent required. *A member's own WHOOP data, after they approve the app.* https://developer.whoop.com/api/
- **Synthea patient table** (schema) — Synthetic patients. Columns only, no fake chart. *Privacy-safe prototypes without real patient data.* https://synthea.mitre.org/
- **HL7 FHIR** (guidance) — How records are supposed to move. *How records, referrals, and wearable summaries move between systems.* https://hl7.org/fhir/
- **WHOOP Connected Care** (guidance) — An example of wearable-enabled care. Not a data download. *Seeing one model for connecting a wearable to care.* https://www.whoop.com/us/en/connected-care/
- **PhysioNet wearable device dataset** (dataset) — Heart rate, stress, movement, and temperature. Check access rules. *A public wearable series when a member feed is not available.* https://physionet.org/content/wearable-device-dataset/1.0.1/
- **CMS ACCESS Model** (guidance) — A federal model for technology-supported care. *How CMS is testing connected care. Not a patient file.* https://www.cms.gov/priorities/innovation/access-model-participants
- **CMS Care Update Template** (guidance) — What a care update between teams is expected to carry. *The fields a referral or wearable summary should not invent.* https://www.cms.gov/priorities/innovation/files/access-care-update-template.pdf

#### H2: Keeping residents connected to health coverage

> Renewal notices miss people. The state still decides eligibility.

- **CDC PLACES, Massachusetts** (dataset) — County prevalence. Five adult measures. *Where the health burden sits, by county.* https://data.cdc.gov/resource/swc5-untb.json?$select=year,locationname,measure,data_value,low_confidence_limit,high_confidence_limit,totalpopulation&$where=stateabbr%3D%27MA%27%20AND%20measure%20in(%27Obesity%20among%20adults%27,%27Diagnosed%20diabetes%20among%20adults%27,%27Visits%20to%20doctor%20for%20routine%20checkup%20within%20the%20past%20year%20among%20adults%27,%27Frequent%20mental%20distress%20among%20adults%27,%27Current%20cigarette%20smoking%20among%20adults%27)%20AND%20data_value_type%3D%27Crude%20prevalence%27&$limit=500
- **MassGIS environmental justice block groups** (dataset) — Where outreach has to work harder. *Where outreach for coverage or trials has to work harder.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **Synthea patient table** (schema) — Synthetic patients. Columns only, no fake chart. *Privacy-safe prototypes without real patient data.* https://synthea.mitre.org/
- **MassHealth federal updates** (guidance) — Renewal policy. Not an eligibility API. *What is changing in renewal before building any assistant.* https://www.mass.gov/info-details/masshealth-federal-updates
- **CMS Medicaid eligibility and enrollment** (guidance) — Federal renewal rules. *The rules a coverage tool has to respect.* https://www.medicaid.gov/medicaid/eligibility/index.html
- **Census health insurance** (guidance) — Coverage and uninsured estimates. Not a person's status. *Where coverage gaps concentrate, before any eligibility guess.* https://www.census.gov/topics/health/health-insurance/data.html
- **CDC Social Vulnerability Index** (guidance) — Socioeconomic and geographic vulnerability. *Which communities a notice or a clinic is most likely to miss.* https://svi.cdc.gov/
- **Massachusetts CHIA** (guidance) — State spending, coverage, and hospital performance. *Massachusetts system context behind a coverage or access demo.* https://www.chiamass.gov/

#### H3: Improving healthcare access and coordination

> A referral is not a finished visit. Connect the whole care journey.

- **Western Massachusetts acute hospitals** (dataset) — Western Mass hospitals and bed counts. *Rural specialty capacity and where care actually sits.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hospitals/MapServer/0/query?where=1%3D1&outFields=FACILITY_NAME,FACILITY_TYPE,MUNICIPALITY,COUNTY,ICU,MED_SURG,PEDIATRIC&returnGeometry=false&resultRecordCount=200&f=json
- **CDC PLACES, Massachusetts** (dataset) — County prevalence. Five adult measures. *Where the health burden sits, by county.* https://data.cdc.gov/resource/swc5-untb.json?$select=year,locationname,measure,data_value,low_confidence_limit,high_confidence_limit,totalpopulation&$where=stateabbr%3D%27MA%27%20AND%20measure%20in(%27Obesity%20among%20adults%27,%27Diagnosed%20diabetes%20among%20adults%27,%27Visits%20to%20doctor%20for%20routine%20checkup%20within%20the%20past%20year%20among%20adults%27,%27Frequent%20mental%20distress%20among%20adults%27,%27Current%20cigarette%20smoking%20among%20adults%27)%20AND%20data_value_type%3D%27Crude%20prevalence%27&$limit=500
- **CMS hospital ratings, Massachusetts** (dataset) — Federal overall rating. No street address. *Which hospitals CMS scores, and where.* https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0?limit=100&conditions[0][property]=state&conditions[0][value]=MA&conditions[0][operator]==
- **CMS hospital readmissions** (dataset) — Excess readmission ratio, Massachusetts. *Which hospitals CMS flags for readmissions.* https://data.cms.gov/provider-data/api/1/datastore/query/9n3s-kdb3/0?limit=100&conditions[0][property]=state&conditions[0][value]=MA&conditions[0][operator]==
- **MassGIS environmental justice block groups** (dataset) — Where outreach has to work harder. *Where outreach for coverage or trials has to work harder.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **Synthea patient table** (schema) — Synthetic patients. Columns only, no fake chart. *Privacy-safe prototypes without real patient data.* https://synthea.mitre.org/
- **Massachusetts rural health** (guidance) — Rural access, from the state. *Framing specialty-care gaps outside metro Boston.* https://www.mass.gov/rural-health
- **HRSA Data Warehouse** (guidance) — Shortage areas and workforce. *Shortage designations around rural specialty care.* https://data.hrsa.gov/
- **HL7 FHIR** (guidance) — How records are supposed to move. *How records, referrals, and wearable summaries move between systems.* https://hl7.org/fhir/
- **CMS ACCESS Model** (guidance) — A federal model for technology-supported care. *How CMS is testing connected care. Not a patient file.* https://www.cms.gov/priorities/innovation/access-model-participants
- **CMS Care Update Template** (guidance) — What a care update between teams is expected to carry. *The fields a referral or wearable summary should not invent.* https://www.cms.gov/priorities/innovation/files/access-care-update-template.pdf
- **CDC Social Vulnerability Index** (guidance) — Socioeconomic and geographic vulnerability. *Which communities a notice or a clinic is most likely to miss.* https://svi.cdc.gov/
- **Massachusetts CHIA** (guidance) — State spending, coverage, and hospital performance. *Massachusetts system context behind a coverage or access demo.* https://www.chiamass.gov/
- **CMS Provider Data Catalog** (guidance) — Providers, hospital quality, and facilities. *The federal catalog behind the Massachusetts hospital extracts.* https://data.cms.gov/provider-data/
- **MassGIS data layers** (guidance) — Massachusetts maps for place and access. *Distance, towns, and the geography around a care journey.* https://www.mass.gov/info-details/massgis-data-layers

#### H4: Accelerating biotechnology innovation

> Discovery is slow, expensive, and hard to translate. Drugs, proteins, genomics, and the lab.

- **Massachusetts research institutions** (api) — Works and citations. OpenAlex. *Which campus publishes, before the literature search.* https://api.openalex.org/institutions?filter=geo.region:Massachusetts,type:education&sort=works_count:desc&per_page=25&select=display_name,works_count,cited_by_count,geo
- **PubMed, Massachusetts affiliation, 2024** (api) — Titles and journals for a 2024 slice. *A starting set of papers, with PMIDs.* https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=Massachusetts%5BAD%5D+AND+2024%5BPDAT%5D&retmax=20&retmode=json&tool=hackachusetts&email=hackachusetts@example.com
- **PubMed / NCBI** (guidance) — Papers and APIs. *Discovery and evidence synthesis.* https://www.ncbi.nlm.nih.gov/research/
- **Open Targets** (guidance) — Gene–disease associations and therapeutic targets. *Starting a drug-discovery question from a gene or a disease.* https://platform.opentargets.org/
- **ChEMBL** (guidance) — Bioactive molecules, targets, and assay data. *Looking up a compound before claiming a discovery.* https://www.ebi.ac.uk/chembl/
- **NCBI Gene Expression Omnibus** (guidance) — Public gene expression and genomics studies. *A real expression dataset behind a genomics demo.* https://www.ncbi.nlm.nih.gov/geo/
- **Human Protein Atlas** (guidance) — Protein and gene expression across tissues and disease. *Where a protein shows up before a design claim.* https://www.proteinatlas.org/about/download
- **PubChem** (api) — Structures, properties, and assay results. *A chemical lookup your demo can cite.* https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
- **openFDA drug adverse events** (api) — Reported medication safety events. *Safety reports. Not proof a drug caused the event.* https://open.fda.gov/apis/drug/event/

#### H5: Making clinical research more accessible

> Finding a trial is harder than joining one. Plain language. Real consent.

- **ClinicalTrials.gov studies recruiting in Massachusetts** (api) — Trials recruiting in Massachusetts. *Study discovery and plainer recruitment information.* https://clinicaltrials.gov/api/v2/studies?query.locn=Massachusetts&filter.overallStatus=RECRUITING&pageSize=20&fields=NCTId,BriefTitle,OverallStatus,Condition,Phase
- **MassGIS environmental justice block groups** (dataset) — Where outreach has to work harder. *Where outreach for coverage or trials has to work harder.* https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json
- **CDC Social Vulnerability Index** (guidance) — Socioeconomic and geographic vulnerability. *Which communities a notice or a clinic is most likely to miss.* https://svi.cdc.gov/
- **MassGIS data layers** (guidance) — Massachusetts maps for place and access. *Distance, towns, and the geography around a care journey.* https://www.mass.gov/info-details/massgis-data-layers

## Robotics & hardware

Bring intelligence into the physical world.

### Opportunity areas

**Making Automation Accessible to Manufacturers**  
Massachusetts has manufacturers of many sizes, but smaller operations may lack the time, capital, or specialized staff needed to adopt automation. Integrating robotics into existing processes can create new challenges in quality, flexibility, and worker safety.  
*Explore accessible automation, machine vision, quality monitoring, workflow integration, and workforce support.*

**Robo-Gym Training Environments**  
Training robot brains from real-world data is slow and costly. Making environments of real places for real data collection would be of high utility for physical AI training.  
*Data center gym, consumer home gym, manufacturing factory floor gym.*

**Real-Time Control for Data Quality**  
Robot learning depends on the data it's trained on, but problems in that data are usually caught too late: after a collection session, or after a model trains badly. Noisy sensors, dropped frames, timing drift, poor demonstrations, and gaps in coverage all waste collection time and quietly make models worse.  
*Explore live monitoring of sensor and demonstration streams, automatic flagging of anomalies and low-quality episodes, real-time feedback to operators during data collection, and closed-loop controllers that adjust collection to fill gaps. Work in simulation or with recorded datasets. No physical hardware is required.*

**Swarm Robotics for Collaborative Exploration and Search-and-Rescue**  
Coordinating multiple autonomous robots in dynamic and unpredictable environments presents challenges in communication, navigation, task allocation, and collective decision-making. Swarm robotics offers opportunities for efficient area mapping, exploration, and search-and-rescue operations through decentralized collaboration.  
*Explore Python-based multi-robot simulation, cooperative mapping, decentralized coordination, inter-robot communication, collaborative path planning, and adaptive responses to changing environments.*

**The "Messy Desk" Dynamic Object Sorting**  
Robots excel at sorting uniform objects in fixed grids but struggle when a workspace is cluttered with overlapping, everyday items (pens, keys, mugs, and trash). Handlers need a policy that can quickly identify, approach, and sort disorganized desk items into their correct containers.  
*Heuristic orchestration, occlusion and singulation, data serialization and pipeline design, and scene randomization for reinforcement learning.*

**Safer Inspection of Critical Infrastructure**  
Bridges, roads, rail, and other public assets require periodic inspection, often in locations that are costly or hazardous for crews to reach. In Massachusetts, MassDOT Aeronautics already flies drones to inspect bridges, roads, airports, and rail and transit facilities. The bottleneck has moved from data capture to data use: imagery, condition ratings, and geographic layers live in separate systems, and maintenance teams must decide where to allocate limited budgets. Federal bridge data is also changing format. FHWA will accept transitioned data only in the 2026 and 2027 submittals, which combine converted legacy records with newly collected SNBI data, and a complete, verified SNBI dataset is due for all reportable bridges by March 15, 2028. Any analysis that spans multiple years therefore crosses a schema change.  
*Defect detection and segmentation on inspection imagery; risk-based prioritization that combines condition ratings, structure age, traffic exposure, and location; harmonization of legacy NBI records with SNBI fields; and simulated drone inspection routes that respect standoff distance, coverage, and airspace constraints. No physical hardware is required.*

**Path Planning Classifier**  
How to choose which path planning algorithm for your environmental needs and compute resources or other constraints.  
*Choosing when to use RRT or A*.*

### Challenges

#### R1: Making automation accessible to manufacturers

> Small shops can't staff a robotics team. Vision, quality, and a workflow a small shop can run.

- **Manufacturing and warehousing employment** (dataset) — Private jobs and pay. Massachusetts, 2024. *Where the shops and warehouses already are.* https://data.bls.gov/cew/data/api/2024/a/area/25000.csv
- **ARMBench** (guidance) — Amazon warehouse pick-and-place benchmark. *Segmentation, identification, defects. Images need a request.* https://www.armbench.com/
- **OR-Tools** (tool) — Routing and scheduling. *Scheduling, routing, task allocation, and optimization.* https://developers.google.com/optimization

#### R2: Robo-gym training environments

> Gyms for a data center, a home, a factory. No hardware required.

- **BridgeData V2 demonstrations** (dataset) — 53,192 real WidowX tasks. Not the videos. *Pick a real manipulation episode before downloading the archive.* https://huggingface.co/datasets/IPEC-COMMUNITY/bridge_orig_lerobot/resolve/main/meta/episodes.jsonl
- **DROID-100 Franka demonstrations** (dataset) — 100 real Franka runs at 15 Hz. *A public slice of the DROID teleoperation set.* https://huggingface.co/datasets/lerobot/droid_100/resolve/main/meta/episodes/chunk-000/file-000.parquet
- **Open X-Embodiment dataset index** (dataset) — Which robot datasets exist. Not the episodes. *Pick a training set before downloading terabytes.* https://docs.google.com/spreadsheets/d/1rPBD77tk60AEIGZrGSODwyyzs5FgCU9Uz3h-3_t2A9g/export?format=csv&gid=0
- **ROS 2** (tool) — The robot software framework. *Open-source robotics software framework.* https://docs.ros.org/en/rolling/
- **Gazebo** (tool) — Simulator. Heavier to set up. *Robotics simulation for testing navigation and control. More demanding to set up.* https://gazebosim.org/
- **Open X-Embodiment** (dataset) — Robot episodes. Too big to preview. Advanced teams. *Robotics datasets for training manipulation and control models. Suited to advanced teams.* https://github.com/google-deepmind/open_x_embodiment
- **MuJoCo** (tool) — Physics simulation for manipulation and reinforcement learning. *Robot development, manipulation, and reinforcement learning. Runs on Windows, macOS, and Linux.* https://mujoco.org/
- **RoboSpace** (tool) — Browser simulation. 70+ robots. No install. *Quick prototyping in the browser, with no installation.* https://robospace.app/
- **Isaac Sim** (tool) — High-fidelity simulation and synthetic data. NVIDIA GPU. Not native on macOS. *Realistic environments, sensors, and synthetic data. Windows and Linux, with a compatible NVIDIA RTX GPU.* https://developer.nvidia.com/isaac/sim
- **Isaac Lab** (tool) — Reinforcement learning on top of Isaac Sim. Advanced teams. *Robot training in simulation. Requires Isaac Sim and a compatible NVIDIA GPU. Not native on macOS.* https://isaac-sim.github.io/IsaacLab/
- **ManiSkill** (tool) — Tabletop manipulation tasks and synthetic training data. *Simulated tabletop tasks and tools for synthetic training data.* https://maniskill.readthedocs.io/en/latest/
- **YCB Object and Model Set** (dataset) — Household object models for simulated sorting. *Household object models and images for simulated sorting and manipulation.* https://ycb-benchmarks.s3.amazonaws.com/index.html
- **Google Scanned Objects** (dataset) — Scanned household items for randomized scenes. *Scanned household items for randomized virtual environments.* https://research.google/blog/scanned-objects-by-google-research-a-dataset-of-3d-scanned-common-household-items/

#### R3: Real-time control for data quality

> Bad data shows up after the run. Flag the bad episode live.

- **BridgeData V2 demonstrations** (dataset) — 53,192 real WidowX tasks. Not the videos. *Pick a real manipulation episode before downloading the archive.* https://huggingface.co/datasets/IPEC-COMMUNITY/bridge_orig_lerobot/resolve/main/meta/episodes.jsonl
- **DROID-100 Franka demonstrations** (dataset) — 100 real Franka runs at 15 Hz. *A public slice of the DROID teleoperation set.* https://huggingface.co/datasets/lerobot/droid_100/resolve/main/meta/episodes/chunk-000/file-000.parquet
- **Open X-Embodiment dataset index** (dataset) — Which robot datasets exist. Not the episodes. *Pick a training set before downloading terabytes.* https://docs.google.com/spreadsheets/d/1rPBD77tk60AEIGZrGSODwyyzs5FgCU9Uz3h-3_t2A9g/export?format=csv&gid=0
- **ROS 2** (tool) — The robot software framework. *Open-source robotics software framework.* https://docs.ros.org/en/rolling/
- **Open X-Embodiment** (dataset) — Robot episodes. Too big to preview. Advanced teams. *Robotics datasets for training manipulation and control models. Suited to advanced teams.* https://github.com/google-deepmind/open_x_embodiment
- **MuJoCo** (tool) — Physics simulation for manipulation and reinforcement learning. *Robot development, manipulation, and reinforcement learning. Runs on Windows, macOS, and Linux.* https://mujoco.org/

#### R4: Swarm robotics for search and rescue

> Many robots. No central boss. Map, talk, and replan together.

- **Boston street centerlines** (dataset) — 19,440 real street segments, with geometry. *Path planning and cooperative mapping on the city's actual road network.* https://data.boston.gov/api/3/action/datastore_search?resource_id=6fa7932b-7bc8-42bc-9250-168d5f5dc1ad&fields=ST_NAME,ST_TYPE,SPEEDLIMIT,ONEWAY,NBHD_L,ZIP_L,FT_COST,TF_COST,Shape_Length,shape_wkt&limit=100
- **Boston street grid, 256** (dataset) — Open and blocked cells for a path planner. *A* or RRT on one Boston grid.* https://movingai.com/benchmarks/street/Boston_0_256.map.zip
- **PythonRobotics** (tool) — A* and RRT, in Python. *Open-source path planning and robotics algorithm examples.* https://github.com/AtsushiSakai/PythonRobotics
- **ROS 2** (tool) — The robot software framework. *Open-source robotics software framework.* https://docs.ros.org/en/rolling/
- **Navigation2** (tool) — Navigation on ROS 2. *Autonomous navigation stack for ROS 2.* https://navigation.ros.org/
- **Gazebo** (tool) — Simulator. Heavier to set up. *Robotics simulation for testing navigation and control. More demanding to set up.* https://gazebosim.org/
- **OR-Tools** (tool) — Routing and scheduling. *Scheduling, routing, task allocation, and optimization.* https://developers.google.com/optimization
- **RoboSpace** (tool) — Browser simulation. 70+ robots. No install. *Quick prototyping in the browser, with no installation.* https://robospace.app/

#### R5: The "Messy Desk" dynamic object sorting

> Pens, keys, mugs, and trash, overlapping. Find it, separate it, sort it.

- **ARMBench** (guidance) — Amazon warehouse pick-and-place benchmark. *Segmentation, identification, defects. Images need a request.* https://www.armbench.com/
- **Gazebo** (tool) — Simulator. Heavier to set up. *Robotics simulation for testing navigation and control. More demanding to set up.* https://gazebosim.org/
- **MuJoCo** (tool) — Physics simulation for manipulation and reinforcement learning. *Robot development, manipulation, and reinforcement learning. Runs on Windows, macOS, and Linux.* https://mujoco.org/
- **Isaac Sim** (tool) — High-fidelity simulation and synthetic data. NVIDIA GPU. Not native on macOS. *Realistic environments, sensors, and synthetic data. Windows and Linux, with a compatible NVIDIA RTX GPU.* https://developer.nvidia.com/isaac/sim
- **Isaac Lab** (tool) — Reinforcement learning on top of Isaac Sim. Advanced teams. *Robot training in simulation. Requires Isaac Sim and a compatible NVIDIA GPU. Not native on macOS.* https://isaac-sim.github.io/IsaacLab/
- **ManiSkill** (tool) — Tabletop manipulation tasks and synthetic training data. *Simulated tabletop tasks and tools for synthetic training data.* https://maniskill.readthedocs.io/en/latest/
- **OCID** (dataset) — Labeled RGB-D scenes with overlapping objects. *Detection and occlusion handling in clutter.* https://www.acin.tuwien.ac.at/en/vision-for-robotics/software-tools/object-clutter-indoor-dataset/
- **OSD** (dataset) — RGB-D scenes with stacked and occluded objects. *Quick prototypes on stacked and occluded objects.* https://www.acin.tuwien.ac.at/en/vision-for-robotics/software-tools/osd/
- **GraspNet-1Billion** (dataset) — Cluttered tabletops with grasp annotations. *Robotic picking and manipulation in clutter.* https://graspnet.net/datasets.html
- **YCB Object and Model Set** (dataset) — Household object models for simulated sorting. *Household object models and images for simulated sorting and manipulation.* https://ycb-benchmarks.s3.amazonaws.com/index.html
- **Google Scanned Objects** (dataset) — Scanned household items for randomized scenes. *Scanned household items for randomized virtual environments.* https://research.google/blog/scanned-objects-by-google-research-a-dataset-of-3d-scanned-common-household-items/
- **UW RGB-D Objects and Scenes** (dataset) — Household objects and annotated indoor scenes. *Classification and recognition of household objects in indoor scenes.* https://rgbd-dataset.cs.washington.edu/

#### R6: Safer inspection of critical infrastructure

> The drone already flew. The budget still has to choose. Defects, risk, and the NBI to SNBI change.

- **National Bridge Inventory, Massachusetts** (dataset) — What it carries, year built, condition. *Bridge inventory, condition ratings, and historical inspection information.* https://www.fhwa.dot.gov/bridge/nbi/2022/delimited/MA22.txt
- **National Bridge Inventory** (guidance) — The federal inventory. The Massachusetts file is the table above. *Bridge inventory, condition ratings, and historical inspection information.* https://www.fhwa.dot.gov/bridge/nbi.cfm
- **FHWA SNBI documentation** (guidance) — The new federal bridge inspection standard. *Schema conversion between legacy NBI records and SNBI fields.* https://www.fhwa.dot.gov/bridge/snbi.cfm
- **FHWA InfoBridge** (guidance) — Bridge conditions and history for prioritization. *Bridge conditions and historical data for maintenance prioritization.* https://infobridge.fhwa.dot.gov/Data
- **dacl10k** (dataset) — Annotated bridge inspection images. *Detecting structural damage and defects in inspection imagery.* https://huggingface.co/datasets/Voxel51/dacl10k
- **CODEBRIM** (dataset) — Labeled concrete defects: cracks and corrosion. *Detecting concrete defects, including cracks and corrosion.* https://datasetninja.com/codebrim
- **MassGIS data layers** (guidance) — Massachusetts maps. *Massachusetts infrastructure and geographic layers for mapping and prioritization.* https://www.mass.gov/info-details/massgis-data-layers

#### R7: Path planning classifier

> RRT or A*, for this scene and this budget. Pick the planner.

- **Boston street centerlines** (dataset) — 19,440 real street segments, with geometry. *Path planning and cooperative mapping on the city's actual road network.* https://data.boston.gov/api/3/action/datastore_search?resource_id=6fa7932b-7bc8-42bc-9250-168d5f5dc1ad&fields=ST_NAME,ST_TYPE,SPEEDLIMIT,ONEWAY,NBHD_L,ZIP_L,FT_COST,TF_COST,Shape_Length,shape_wkt&limit=100
- **Boston street grid, 256** (dataset) — Open and blocked cells for a path planner. *A* or RRT on one Boston grid.* https://movingai.com/benchmarks/street/Boston_0_256.map.zip
- **PythonRobotics** (tool) — A* and RRT, in Python. *Open-source path planning and robotics algorithm examples.* https://github.com/AtsushiSakai/PythonRobotics
- **ROS 2** (tool) — The robot software framework. *Open-source robotics software framework.* https://docs.ros.org/en/rolling/
- **Navigation2** (tool) — Navigation on ROS 2. *Autonomous navigation stack for ROS 2.* https://navigation.ros.org/
- **OR-Tools** (tool) — Routing and scheduling. *Scheduling, routing, task allocation, and optimization.* https://developers.google.com/optimization
