// Demo fixtures: real Boston Open311 records (research/open311/demo-picks.json and the
// 2026-09-24..10-24 snapshot). Road Inventory fields (segment, jurisdiction) are hand-set
// here; the seed sets them offline from the MassDOT layer.

import type { Report } from "@/core/types";
import { familyOf } from "@/core/entities";
import { parseReportText } from "@/core/language";

/** The clock the fixture priorities are computed against. */
export const FIXTURE_NOW = "2026-10-24T18:00:00Z";

interface RawRecord {
  id: string;
  serviceName: string;
  requestedAt: string;
  address: string;
  lat: number;
  lon: number;
  description?: string;
  mediaUrls: string[];
  cityStatus: "open" | "closed";
  cityStatusNotes?: string;
  roadSegmentId?: string;
  jurisdictionCode?: string;
  roadName?: string;
}

// Scenes: Morrissey streetlight (DCR), Gallivan streetlight (MassDOT), 525 VFW Pkwy (DCR),
// Hudson St fallen branches (the real Chinese-language report), Beacon St streetlight (city),
// Metropolitan Ave & Poplar St signal ×9, 14 Quincy St pothole ×8, Centre St & Green St signal ×9.
const RAW: RawRecord[] = [
  {"id":"da52decb-5e70-4b1b-82e1-3816ae370e15","serviceName":"Street Light Outage","requestedAt":"2026-10-10T04:11:12Z","address":"Mount Vernon St & William T Morrissey Blvd","lat":42.32036898,"lon":-71.04987246,"description":"Two street lights out at:\r\n-Dorchester, SE corner of intersection of Morrissey Blvd off ramp and Mount Vernon St. 42°19'13.3\"N 71°02'59.5\"W   https://maps.app.goo.gl/1FaCVmnsAvH3T9P68\r\n-Dorchester, ~200 ft NW of above, toward Morrissey Blvd overpass over Mt. Vernon St. \r\n42°19'14.3\"N 71°03'01.8\"W   https://maps.app.goo.gl/RWJzt8zjbHnU4Lvm6\r\n-Two (of four) lights mounted on the sidewalls of the Mt. Vernon St. underpass under Mt. Vernon St. One on one each side of Mt. Vernon St. \r\nThank you!","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791604968/boston/production/eqnbmxu5xnmn6cvlmvue.jpg","https://spot-boston-res.cloudinary.com/image/upload/v1791604970/boston/production/ztz6gjd9vlbvgdafugn5.jpg","https://spot-boston-res.cloudinary.com/image/upload/v1791604973/boston/production/jrnsqrpuwbh5f7jt8csw.jpg"],"cityStatus":"open","roadSegmentId":"seg-morrissey-1","jurisdictionCode":"3","roadName":"William T Morrissey Blvd"},
  {"id":"6ca3b0f1-de7d-41b5-8973-4ca6a2f2d3e3","serviceName":"Street Light Outage","requestedAt":"2026-09-28T10:55:50Z","address":"593 Gallivan Blvd, Boston, MA 02124","lat":42.283098,"lon":-71.0514,"mediaUrls":[],"cityStatus":"open","cityStatusNotes":"Transitioned. Reallocated to Non-City of Boston Stakeholder.","roadSegmentId":"seg-gallivan-1","jurisdictionCode":"1","roadName":"Gallivan Blvd"},
  {"id":"0e411b27-fc81-4f13-a6fd-6c3cc44d1cb0","serviceName":"Street Light Outage","requestedAt":"2026-10-07T20:19:37Z","address":"525 VFW Pkwy, Boston, MA 02467","lat":42.29576431,"lon":-71.15395578,"description":"Extended power outage caused by Eversource work (began 10:45 am, not expected to resolve until 12am tomorrow); no notice given to residents and Eversource is providing little information about the problem ","mediaUrls":[],"cityStatus":"open","roadSegmentId":"seg-vfw-1","jurisdictionCode":"3","roadName":"Veterans of Foreign Wars Pkwy"},
  {"id":"e3c42dbf-33fe-474c-9a54-f617b449eba6","serviceName":"Fallen Tree or Branches","requestedAt":"2026-10-07T00:15:55Z","address":"79 Hudson St, Boston, MA 02111","lat":42.34886311,"lon":-71.06085076,"description":"-- auto translated (en) --\nFalling branches!\n-- original (zh-hans-US) --\n掉落的樹枝！","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791332107/boston/production/tqpxpopioeptz7yumtad.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Request Completed - fallen tree branch removed. DR JB IT.","roadSegmentId":"seg-hudson-1","jurisdictionCode":"2","roadName":"Hudson St"},
  {"id":"98cb500b-073b-4681-b1ed-d24cee1dd38f","serviceName":"Street Light Outage","requestedAt":"2026-10-22T17:38:47Z","address":"483 Beacon St, Boston, MA 02115","lat":42.350724,"lon":-71.0891145,"description":"Streetlight out 483 Beacon Street, Back Bay Boston","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1792690631/lryn5hkpv2vtunj5tmov.jpg"],"cityStatus":"open","roadSegmentId":"seg-beacon-1","jurisdictionCode":"2","roadName":"Beacon St"},
  {"id":"5d309bf1-e925-4bb9-baa7-3306630a1cdc","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T12:21:37Z","address":"Metropolitan Ave & Poplar St","lat":42.27590301,"lon":-71.12567547,"description":"Traffic lights are out. I dont have a photo. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791289271/boston/production/raatchf4qqotwti86as0.jpg"],"cityStatus":"open","cityStatusNotes":"Resolved. Request Completed - reported by shop all out on arrival same while at location lights restored by eversourse tightened power connects+ grounds on back board +brakers intersection running stop+go.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"0b9d39af-6f54-40e5-ac8c-ae48dd6e3a92","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T12:35:59Z","address":"Metropolitan Ave & Poplar St","lat":42.275907,"lon":-71.125668,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Noted. Duplicate Request.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"6f5ffea5-f5cb-4f00-bf80-b1611abd278e","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T14:54:28Z","address":"Metropolitan Ave & Poplar St","lat":42.275907,"lon":-71.125668,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Resolved. Request Completed - Reported by shop all out, upon arrival stop and go, checked time and day OK, indications coming up normal. Int.stop and go.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"c9f263ba-a9bb-40ef-b6f0-2410f6f7478e","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T21:16:20Z","address":"Metropolitan Ave & Poplar St","lat":42.275907,"lon":-71.125668,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Resolved. Completed by Task - Reported by shop all out, upon arrival stop and go checked indications coming up normal, clear alarms ok. Int.stop and go.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"b4969286-0f05-4a65-a581-39b0abfd245a","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T22:49:02Z","address":"Metropolitan Ave & Poplar St","lat":42.275907,"lon":-71.125668,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Resolved. Completed by Task - No power in the CB, is Eversource problem, notified tech base, and 311.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"c6a2a7e0-64eb-4d1f-a8b4-3e13241e4b4f","serviceName":"Traffic Signal Request","requestedAt":"2026-10-07T11:31:00Z","address":"Metropolitan Ave & Poplar St","lat":42.275907,"lon":-71.125668,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Resolved. Completed by Task.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"48089feb-190a-471a-9984-8e3f1d1d9d6c","serviceName":"Traffic Signal Request","requestedAt":"2026-10-07T11:41:50Z","address":"Metropolitan Ave & Poplar St","lat":42.27589526,"lon":-71.12568116,"description":"Traffic lights out. Not working","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791373284/boston/production/oflboc8eja1saeabgmj1.jpg"],"cityStatus":"open","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"f7d35ca8-778b-45e3-b084-b94b00ebee7f","serviceName":"Traffic Signal Request","requestedAt":"2026-10-07T14:07:32Z","address":"Metropolitan Ave & Poplar St","lat":42.27593237,"lon":-71.12567078,"description":"Traffic lights are not working. It’s been 2 days. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791382050/boston/production/gjw4bz8hrsgxviatv19z.jpg"],"cityStatus":"closed","cityStatusNotes":"Transitioned. Reallocated to Non-City of Boston Stakeholder - We identified a issue in the disconnect. Our contractor has been notified and is going to replace the circuit breaker in the disconnect. He will be on scene this afternoon.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"1c8233a1-5620-41b2-94be-96f07e98e765","serviceName":"Traffic Signal Request","requestedAt":"2026-10-07T15:55:05Z","address":"Metropolitan Ave & Poplar St","lat":42.27573226,"lon":-71.12564689,"description":"Traffic lights out on corner of Popular and Metropolitan Streets","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791388503/boston/production/g2j3n1rfoq02o3r17vuz.jpg"],"cityStatus":"closed","cityStatusNotes":"Noted. Duplicate Request.","roadSegmentId":"seg-metropolitan-1","jurisdictionCode":"2","roadName":"Metropolitan Ave"},
  {"id":"bb0a0241-7161-4b09-b2a0-b3144b71995b","serviceName":"Pothole","requestedAt":"2026-09-24T21:48:29Z","address":"14 Quincy St, Boston, MA 02119","lat":42.31613737,"lon":-71.08172201,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1790286485/boston/production/reeitul9acvuvv9cpke4.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"17f93e7b-1931-4cf3-b27e-a90c79ddc452","serviceName":"Pothole","requestedAt":"2026-09-26T19:17:42Z","address":"Quincy Pl & Quincy St","lat":42.31612349,"lon":-71.08177364,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1790450257/boston/production/g1scchbs0xg9apg59jil.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"217a85da-867b-4236-b2b7-4d7bddf50737","serviceName":"Pothole","requestedAt":"2026-09-30T00:16:24Z","address":"14 Quincy St, Boston, MA 02119","lat":42.31614506,"lon":-71.08173374,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1790727379/boston/production/nf9m3aia76bpcwnaop2d.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"4e7acfb6-74a3-40ff-b18d-c6030e835e46","serviceName":"Pothole","requestedAt":"2026-10-01T22:47:44Z","address":"20 Quincy St, Boston, MA 02121","lat":42.31616365,"lon":-71.08168613,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1790894862/boston/production/w1rnyhgqfwtktwhxogko.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"9cc4fd7e-0625-418d-9517-1e2def1bc1cd","serviceName":"Pothole","requestedAt":"2026-10-03T18:23:51Z","address":"Quincy Pl & Quincy St","lat":42.31610886,"lon":-71.08172402,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791051827/boston/production/eufqaafqxxgy9aqvg5pr.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"ca4328ae-4c93-41d9-9722-8e54594aaed1","serviceName":"Pothole","requestedAt":"2026-10-06T21:56:06Z","address":"Quincy Pl & Quincy St","lat":42.31611407,"lon":-71.08172067,"description":"Pothole in the street","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791323762/boston/production/h27hlpsvi1sdzklwyu8n.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"6fbbe232-c433-4a18-8ef4-132b4b1684f8","serviceName":"Pothole","requestedAt":"2026-10-10T20:14:24Z","address":"Quincy Pl & Quincy St","lat":42.31610118,"lon":-71.08172167,"description":"Pothole left in road after repair","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791663259/boston/production/ky1nc9e4s8hawleorjsy.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"9748d9d0-e399-4a19-be80-202d36312509","serviceName":"Pothole","requestedAt":"2026-10-11T17:35:52Z","address":"14 Quincy St, Boston, MA 02119","lat":42.31613762,"lon":-71.081721,"description":"Pothole in the street it's been there for 4 weeks. This is the 8th or 9th report I've made about this. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791740147/boston/production/kqsvresn0pgnmgxlgvj4.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Violation issued.","roadSegmentId":"seg-quincy-1","jurisdictionCode":"2","roadName":"Quincy St"},
  {"id":"ae22d0d7-ee8c-41c9-bde8-e905f81d9933","serviceName":"Traffic Signal Request","requestedAt":"2026-09-30T19:05:08Z","address":"Centre St & Green St","lat":42.31321797,"lon":-71.11399565,"description":"The light at Green St & Centre St in JP was recently repaired & the light timing is now so short that only a couple cars can make it through the light & it’s causing a major backup down Green St ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1790795084/boston/production/hicsswufb9nc61dhbu7v.jpg"],"cityStatus":"open","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"92987d0a-3426-446c-a29c-4f6f71862cf8","serviceName":"Traffic Signal Request","requestedAt":"2026-10-06T12:03:29Z","address":"Centre St & Green St","lat":42.31324276,"lon":-71.11409898,"description":"Timing for Green Street light (Green & Centre) at 8AM is causing major traffic on Green Street. Please adjust timing to allow for more traffic to clear on Green Street. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791288095/boston/production/ri0w0iejliyrhqmht7wo.jpg","https://spot-boston-res.cloudinary.com/image/upload/v1791288097/boston/production/ihtpwwuofwwuu4vu4tod.jpg"],"cityStatus":"open","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"bebe1af8-953f-437d-ac0a-5abb28556480","serviceName":"Traffic Signal Request","requestedAt":"2026-10-08T11:34:35Z","address":"Centre St & Green St","lat":42.31323,"lon":-71.1140985,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Noted. This case was not processed correctly. A new case was created BCS-00050106.","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"b996114f-f4d9-4ea7-9479-f1352154155d","serviceName":"Traffic Signal Request","requestedAt":"2026-10-08T11:57:27Z","address":"Centre St & Green St","lat":42.31321044,"lon":-71.11394295,"description":"Traffic light timing doesn’t work. Going from green street to Centre street in JP is completely backed up every morning because there isn’t enough time for the light ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791460642/boston/production/pq6v00xbefwmted5yfgx.jpg"],"cityStatus":"closed","cityStatusNotes":"Resolved. Completed by Task - Adjusted timing for Green Street during PM peak time.","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"a2b71d46-f8c5-41a6-98d6-373880c978a9","serviceName":"Traffic Signal Request","requestedAt":"2026-10-08T12:13:47Z","address":"Centre St & Green St","lat":42.3131589,"lon":-71.11406674,"description":"Traffic light at Centre St and Green St in JP was recently configured and is much, much shorter than it was. Approximately four cars can go through per light cycle which significantly slows traffic. There is no right turn on red and there is a large bike lane where the turn lane should be, so cars need to wait for the light. This has made traffic much worse in an area where it was already bad. The lights should be reset to how they were before. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791461555/boston/production/qh9fykjtai5ojroxfjnt.jpg"],"cityStatus":"open","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"211ba048-65b7-4e18-80dd-d2b67d31f62b","serviceName":"Traffic Signal Request","requestedAt":"2026-10-08T18:37:01Z","address":"Centre St & Green St","lat":42.31323,"lon":-71.1140985,"mediaUrls":[],"cityStatus":"open","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"e0c67c05-58fb-4b7b-9c02-155190c9857b","serviceName":"Traffic Signal Request","requestedAt":"2026-10-09T12:08:28Z","address":"Centre St & Green St","lat":42.3132291,"lon":-71.11407703,"description":"Centre st and green st. City did something recently that has caused traffic to slow much more slowly than usual. 3-4 cars can go per cycle which then causes cars to illegally turn on red creating a danger for pedestrians. Please reset to how it was before! 8 seconds is not long enough for this major road. ","mediaUrls":["https://spot-boston-res.cloudinary.com/image/upload/v1791547579/boston/production/sfk1v8jjsvy6ktxofaep.jpg"],"cityStatus":"open","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"f68c46f0-6439-4b4d-81a0-e66758094552","serviceName":"Traffic Signal Request","requestedAt":"2026-10-09T18:13:48Z","address":"Centre St & Green St","lat":42.31323,"lon":-71.1140985,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Noted. This case was not processed correctly. A new case was created BCS-00050106.","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
  {"id":"d1751381-8166-4337-9814-17b1f4369ba6","serviceName":"Traffic Signal Request","requestedAt":"2026-10-09T20:08:32Z","address":"Centre St & Green St","lat":42.31323,"lon":-71.1140985,"mediaUrls":[],"cityStatus":"closed","cityStatusNotes":"Resolved. Completed by Task - Adjusted Time for Green Street.","roadSegmentId":"seg-centre-1","jurisdictionCode":"2","roadName":"Centre St"},
];

function toReport(r: RawRecord): Report {
  const { text, originalText, preferredLanguage } = parseReportText(r.description);
  return {
    ...r,
    source: "open311",
    serviceFamily: familyOf(r.serviceName),
    description: text,
    originalText,
    preferredLanguage,
  };
}

/** Fresh copies of the seeded reports (callers may mutate them). */
export function fixtureReports(): Report[] {
  return RAW.map(toReport);
}

/**
 * Held back for the live replay: a streetlight on the same Morrissey Blvd segment, ~180 m
 * from the first report. Synthetic (no second real Morrissey streetlight exists in the snapshot).
 */
export function fixtureReplayReports(): Report[] {
  return [
    toReport({
      id: "demo-replay-morrissey-2",
      serviceName: "Street Light Outage",
      requestedAt: "2026-10-24T17:30:00Z",
      address: "Kosciuszko Cir & William T Morrissey Blvd",
      lat: 42.32166607,
      lon: -71.05122307,
      description: "Street light out on Morrissey Blvd near Kosciuszko Circle.",
      mediaUrls: [],
      cityStatus: "open",
      roadSegmentId: "seg-morrissey-1",
      jurisdictionCode: "3",
      roadName: "William T Morrissey Blvd",
    }),
  ];
}
