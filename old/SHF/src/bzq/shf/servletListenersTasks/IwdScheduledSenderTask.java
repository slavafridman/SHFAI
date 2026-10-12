package bzq.shf.servletListenersTasks;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Vector;

import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.IwdServiceCode;
import bzq.shf.bean.PeleIWDBean;
import bzq.shf.model.IWDModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.TibcoQueueMessageSender;
import bzq.shfiwd.SHFIWD;
import bzq.utils.BaseConvert;

public class IwdScheduledSenderTask implements Runnable {
	
	private static Logger logger = Logger.getLogger(IwdScheduledSenderTask.class);
	private ServletContext servCtx = null;
	private Calendar lastPulseCheck = Calendar.getInstance();
	private Vector<IwdServiceCode> iwdServiceCodes = null;
	
	public IwdScheduledSenderTask () {
		lastPulseCheck.add(Calendar.HOUR_OF_DAY, -24);
	}

	public void run() {
		// must have try and catch first thing, else, if fail, the whole chain of execution might stop (executors might stop on first exception / error)
		try {
			// Pulse check START
			int interval = 60*8;	// minutes
			Calendar currDate = Calendar.getInstance();
			
			if (currDate.getTimeInMillis() - lastPulseCheck.getTimeInMillis() > interval*60*1000) {
				lastPulseCheck = currDate;
				logger.info("Pulse check for " + this.getClass().getName());
			}
			// Pulse check END
			
//			logger.info("Starting IwdScheduledSenderTask ...");
			
			// 1st get all agents that are timed
			int endTreatTime = 5;
			
			// sql 1 - get relevant timings
			StringBuffer sql1 = new StringBuffer();
			sql1.append("SELECT pe.*, l.module_type, l.module_time_to_complete, e.org_unit_id ");
			sql1.append("FROM shifter.shf_pele_employees pe ");
			sql1.append("INNER JOIN shifter.shf_pele_lomdot l ON l.module_id = pe.module_id ");
			sql1.append("INNER JOIN shifter.shf_employees e on e.emp_id_number = pe.emp_id ");
			sql1.append("WHERE pe.iwd_status = ? ");		// 1,
			sql1.append("AND pe.iwd_timing <= SYSDATE + ?/1440 ");	// 2
			
			// sql 2 - for relevant timings get shift breaks
			StringBuffer sql2 = new StringBuffer();
			sql2.append("SELECT ");
			sql2.append("NVL(c.new_employee_id, d.emp_id_number) AS emp_id_number, ");
			sql2.append("em.org_unit_id, x.start_time, x.end_time ");
			sql2.append("FROM shifter.shf_employee_day d ");
			sql2.append("LEFT JOIN shifter.shf_day_changes c ON c.shf_employee_day_id = d.shf_employee_day_id ");
			sql2.append("INNER JOIN shifter.shf_employee_exceptions x ON x.agent_day_id = NVL(c.shf_employee_day_id, d.shf_employee_day_id) ");
			sql2.append("INNER JOIN ");
			sql2.append("( ");
			sql2.append("	SELECT e.emp_id, se.org_unit_id "); 
			sql2.append("	FROM shifter.shf_pele_employees e ");
			sql2.append("	INNER JOIN shifter.shf_pele_lomdot l ON l.module_id = e.module_id ");
			sql2.append("	INNER JOIN shifter.shf_employees se ON se.emp_id_number = e.emp_id ");			
			sql2.append("	WHERE e.iwd_status = ? ");		// 1
			sql2.append("	AND e.iwd_timing <= SYSDATE + ?/1440 ");	// 2
			sql2.append("	GROUP BY e.emp_id, se.org_unit_id ");
			sql2.append(") em ON SUBSTR(em.emp_id,1,8) = NVL(c.new_employee_id, d.emp_id_number) ");
			sql2.append("WHERE d.wm_date = TRUNC(SYSDATE) ");
			sql2.append("AND x.state_type = ? ");		// 3
			
			// sql 3 - get iwd SERVICE field values for business units
			StringBuffer sql3 = new StringBuffer();
			sql3.append("SELECT sc.* FROM shifter.shf_pele_iwd_service_codes sc ");
			
			Vector<PeleIWDBean> iwdBeanVec = null;	// all agents to be sent to iwd
			Vector<BreakBean> breakBeanVec = null;	// breaks for agents to be sent to iwd (do not send if conflicts with agent's breaks)			
			DBAccess db = null;
			
			try {
				db = new DBAccess();
				// sql 1
				db.prepareStatement(sql1.toString());
				
				db.setInt(1, SHFConstants.IWD_STATUS_PENDING);	// 1
				db.setInt(2, endTreatTime);			// 2
				
				db.executeQuery();		// if the 1st query fails due to DBQueryNoRowsException, then 2nd should not run 
				iwdBeanVec = new Vector<PeleIWDBean>();
				db.populate("bzq.shf.bean.PeleIWDBean", iwdBeanVec);
				
				// sql 2
				db.prepareStatement(sql2.toString());
				
				db.setInt(1, SHFConstants.IWD_STATUS_PENDING);	// 1
				db.setInt(2, endTreatTime);			// 2
				db.setInt(3, SHFConstants.STATE_BREAK);			// 3
				
				try {
					db.executeQuery();
					breakBeanVec = new Vector<BreakBean>();
					db.populate("bzq.shf.bean.BreakBean", breakBeanVec);
				} catch (DBQueryNoRowsException e) {
					// nothing to do, no breaks found
				}
				
				// sql 3
				db.prepareStatement(sql3.toString());
				db.executeQuery();
				iwdServiceCodes = new Vector<IwdServiceCode>();
				db.populate("bzq.shf.bean.IwdServiceCode", iwdServiceCodes);
				
			} catch (DBQueryNoRowsException e) {
				// nothing to do
			} catch (DBException e) {
				logger.error("DB error while populating : " +e.getMessage(), e);
				throw e;
			} finally {
				try {
					db.close();
				} catch (DBException e) {
					logger.error("Error while closing connection : " +e.getMessage(), e);
				}
			}
			
			// debug
//			int results = (iwdBeanVec != null && iwdBeanVec.size() > 0) ? iwdBeanVec.size() : 0;
//			logger.info("IWDTask sql select, found " + results +" results");
//			logger.info("endTreatTime is :"+endTreatTime+", sql is : " + sql.toString());			
			
			// 2nd
			// 26.06.2017 Before sending to IWD check if timing is conflicting with agent's breaks, if it is then skip it (and then either skip till next check or put back to pool for reschedule(new timing))
			// check by timing + lomda.length is not in range of break
			Vector<PeleIWDBean> iwdBeanVecForIWD = new Vector<PeleIWDBean>();	// final vec to send to IWD after break check
			Vector<PeleIWDBean> iwdBeanVecForReschedule = new Vector<PeleIWDBean>();	// final vec to send to IWD after break check
			
//			String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(replaceByCritrion.getAllowedAgaf()).getValue();
			
			if (iwdBeanVec != null && iwdBeanVec.size() > 0) {
				if (breakBeanVec != null && breakBeanVec.size() > 0) {		// if breaks found, filter only agents that have no problem with break
					for (PeleIWDBean peleIWDBean : iwdBeanVec) {
						Boolean found = false;
						Boolean isOk = true;
						for (BreakBean breakBean : breakBeanVec) {
							if (peleIWDBean.getEmpId().substring(0, peleIWDBean.getEmpId().length()-1).equals(breakBean.getEmpIdNumber())) {
								found = true;
								int defaultLength = 0;		// default lomda length in minutes
								if (peleIWDBean.getModuleTimeToComplete() > 0) {
									defaultLength = peleIWDBean.getModuleTimeToComplete();
								}else{
									defaultLength = Integer.parseInt(SHFParameters.getIwdDefaultTimeToComplete(SHFTableUtils.getAgafCodeOf(breakBean.getOrgUnitId())).getValue());
								}		
								Calendar lomdaStartPlanned = Calendar.getInstance();
								lomdaStartPlanned.setTime(peleIWDBean.getIwdTiming());
								
								Calendar lomdaEndCalc = Calendar.getInstance();
								lomdaEndCalc.setTime(peleIWDBean.getIwdTiming());
								lomdaEndCalc.add(Calendar.MINUTE, defaultLength);
								
								if (
										! ((lomdaStartPlanned.getTime().before(breakBean.getStartTime()) && lomdaEndCalc.getTime().before(breakBean.getStartTime()))	// if not (lomda starts and end before break
										|| (lomdaStartPlanned.getTime().after(breakBean.getEndTime()) && lomdaEndCalc.getTime().after(breakBean.getEndTime())))			// or starts and ends after break)
									)
								{
									Boolean isRescheduleOnAgentBreak = Boolean.valueOf(SHFParameters.getIwdRescheduleOnAgentBreak(SHFTableUtils.getAgafCodeOf(breakBean.getOrgUnitId())).getValue());
									
									if (!isRescheduleOnAgentBreak) {
										if ( ! currDate.getTime().after(breakBean.getEndTime())) {	// if break ended then its ok to send to IWD
											isOk = false;
										}
									}else {
										isOk = false;
										iwdBeanVecForReschedule.add(peleIWDBean);
									}									
								}		
							}
						}
						
						if (!found || isOk) {	// if agent has no breaks or no conflicts with breaks, send to IWD
							iwdBeanVecForIWD.add(peleIWDBean);
						}
					}
				} else {
					iwdBeanVecForIWD = iwdBeanVec;	// if no breaks found then schedule all agents
				}
			}			
			
			// Reschedule aborted (because of breaks) if option selected
			if (iwdBeanVecForReschedule.size() > 0) {
				StringBuffer sql = new StringBuffer();
				
				sql.append("UPDATE shifter.shf_pele_employees e ");
				sql.append("SET e.iwd_timing = null, e.iwd_status = ? ");	// 1
				sql.append("WHERE  ");
				for (int i = 0; i < iwdBeanVecForReschedule.size(); i++) {
					sql.append("(e.module_id = ? AND e.emp_id = ?) ");	// 2, 3
					if ( i < iwdBeanVecForReschedule.size() -1 ) {
						sql.append("OR ");
					}
				}				
				db = null;
				try {
					db = new DBAccess();
					db.prepareStatement(sql.toString());
					int index = 1;
					db.setInteger(index++, SHFConstants.IWD_STATUS_NONE);		// 1
					for (PeleIWDBean peleIWDBean : iwdBeanVecForReschedule) {
						db.setInteger(index++, peleIWDBean.getModuleId());		// 2
						db.setString(index++, peleIWDBean.getEmpId());			// 3						
					}
					db.executeUpdate();
				} catch(DBUpdateNoRowsException e) {
					
				} catch (DBException e) {
					logger.error("DB error while updating : "+e.getMessage(), e);
				} finally {
					try {
						db.close();
					} catch (DBException e) {
						logger.error("DB error while closing connection : "+e.getMessage(), e);
					}
				}
			}			
			
			// 3rd Send those agents to IWD via TIBCO JMS
			Map<String, Integer> taskTypeCodeMap = new HashMap<String, Integer>();
			taskTypeCodeMap.put("scorm", 5);
			taskTypeCodeMap.put("quiz", 6);
			taskTypeCodeMap.put("questionnaire", 7);
			taskTypeCodeMap.put("choice", 8);
			taskTypeCodeMap.put("sign", 9);
			
			if (iwdBeanVecForIWD.size() > 0) {
				
				Document addConfigDoc = (Document)servCtx.getAttribute("addConfigDoc");
				String queueName = null;
				queueName = SHFUtils.retrieveAttributeValue(addConfigDoc, SHFConstants.SHF_IWD_ATTRIBUTE_VALUE);
				TibcoQueueMessageSender tqms = null;
				
				if (queueName != null && queueName.length() > 0) {
					
					logger.info("Queue name found : " + queueName);
					
					tqms = new TibcoQueueMessageSender(queueName);
					Date now = new Date();
					Vector<PeleIWDBean> sendFailedVec = new Vector<PeleIWDBean>();
					Vector<PeleIWDBean> sendSuccessVec = new Vector<PeleIWDBean>();
					
					for (PeleIWDBean peleIWDBean : iwdBeanVecForIWD) {
						bzq.shfiwd.ObjectFactory of = new bzq.shfiwd.ObjectFactory();
						SHFIWD iwdObject = of.createSHFIWD();
						Calendar iwdTiming = Calendar.getInstance();
						iwdTiming.setTime(peleIWDBean.getIwdTiming());
						iwdTiming.add(Calendar.MINUTE, endTreatTime);
						
						SHFUtils.setSHFIWDMessageDefaults(iwdObject);
						setIwdServiceField(iwdObject, peleIWDBean);		// 2.2019 update according to business units, demand from Erez Taieb
						
						iwdObject.setTaskID(String.valueOf(peleIWDBean.getModuleId()));
						iwdObject.setTime(BaseConvert.dateToString(now, "yyyyMMddHHmmss"));
						iwdObject.setStartTreatTime(BaseConvert.dateToString(peleIWDBean.getIwdTiming(), "yyyyMMddHHmmss"));
						iwdObject.setEndTreatTime(BaseConvert.dateToString(iwdTiming.getTime(), "yyyyMMddHHmmss"));
						iwdObject.setAgentId(peleIWDBean.getEmpId().substring(0, peleIWDBean.getEmpId().length()-1));	// 8 chars
						iwdObject.setTaskType(String.valueOf(taskTypeCodeMap.get(peleIWDBean.getModuleType().toLowerCase())));
						
						String xmlStringMsg = null;
						try {
							xmlStringMsg = SHFUtils.objToXmlString(iwdObject, SHFConstants.SHF_IWD_JAXB_REQUEST_CONTEXT);
						} catch (JAXBException e) {
							logger.error("Error while creating XML string for sending message : " + e.getMessage());
							throw e;
						}
						try {
							logger.info("Sending message to IWD : "+xmlStringMsg);
							tqms.send(xmlStringMsg, false);	// send message and do not close the connection, close after finish sending all
							peleIWDBean.setIwdStatus(SHFConstants.IWD_STATUS_SENT);
							sendSuccessVec.add(peleIWDBean);
						} catch (Exception e) {
							logger.error("Sending to IWD failed for emp id : "+peleIWDBean.getEmpId()+", Module id : "+peleIWDBean.getModuleId()+", Error is : "+e.getMessage(), e);
							sendFailedVec.add(peleIWDBean);
						}
					}
					tqms.close();
					
					logger.info("Updating to 'SENT' status...");
					
					// 3rd Update those agents at shifter side to status "sent"
					if (sendSuccessVec.size() > 0) {
						
						StringBuffer sql = new StringBuffer();
						
						sql.append("UPDATE shifter.shf_pele_employees e SET ");
						sql.append("e.iwd_status = ? ");		// 1
						sql.append("WHERE e.module_id = ? ");	// 2
						sql.append("AND e.emp_id = ? ");		// 3
						
						db = null;
						try {
							db = new DBAccess(false);
							db.prepareStatement(sql.toString());
							
							for (PeleIWDBean peleIWDBean : sendSuccessVec) {
								int index = 1;
								db.setInteger(index++, SHFConstants.IWD_STATUS_SENT);		// 1
								db.setInteger(index++, peleIWDBean.getModuleId());			// 2
								db.setString(index++, peleIWDBean.getEmpId());				// 3
								
								db.executeUpdate();
							}
							db.commit();
						} catch(DBUpdateNoRowsException e) {
							
						} catch (DBException e) {
							logger.error("DB error while updating : "+e.getMessage(), e);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("DB error while closing connection : "+e.getMessage(), e);
							}
						}
						
						// 4th Update employees_history table
						IWDModel iwdModel = new IWDModel();
						iwdModel.insertToPeleEmpHistory(sendSuccessVec);
						
					}
					logger.info("Recurring IWD task ended successfully, sent : " + sendSuccessVec.size() + ", failed : " + sendFailedVec.size());
				} else {
					logger.error("Error while retrieving queue name, name is NULL or EMPTY");
				}
			}
		} catch (Throwable  t) {	// "Throwable" since we must catch errors also
			try {
				logger.error("Error while performing task "+this.getClass().getName()+" : " + t.getMessage(), t);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}	// END Method
	
	public void setIwdServiceField(SHFIWD iwdObject, PeleIWDBean peleIWDBean){
		
		iwdObject.setService("IWD_PELE_LOMDA");		// default value
		
		if (iwdServiceCodes != null && iwdServiceCodes.size() > 0) {
			//get agent org unit's moked
			String mokedOrgUnitId = SHFTableUtils.getMokedCodeOf(peleIWDBean.getOrgUnitId());
			
			// check if mokedOrgUnitId is in iwd service codes if so use relevant iwd code
			for (IwdServiceCode serviceCode : iwdServiceCodes) {
				if (serviceCode.getOrgUnitId().equals(mokedOrgUnitId)) {
					iwdObject.setService(serviceCode.getIwdCode().toUpperCase());	// should be upper case
					break;
				}
			}			
		} else {
			logger.error("iwdServiceCodes is null or size = 0, using default value 'IWD_PELE_LOMDA'");
		}		
	}
	
	//public 

	public ServletContext getServCtx() {
		return servCtx;
	}

	public void setServCtx(ServletContext servCtx) {
		this.servCtx = servCtx;
	}
}	// END Class
