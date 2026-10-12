package bzq.shf.model;

import java.util.Calendar;
import java.util.Date;

import org.apache.log4j.Logger;
import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.shf.bean.BreakBean;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.SoftPhoneForm;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;

public class SoftPhoneModel {

//------------------------------Variables--------------------------------------
	
	private static Logger logger = Logger.getLogger(SoftPhoneModel.class);
	
	private SoftPhoneForm form = null;
	
//------------------------------Constructors-----------------------------------
	
	public SoftPhoneModel () {
		
	}
	
	public SoftPhoneModel (SoftPhoneForm form) {
		this.form = form;
	}
	
	
//------------------------------Logic------------------------------------------

	/**
	 * Function to update agent's actual time of exit to / return from break
	 * 
	 */
	public void updateTimeActual () {
		logger.info("Starting updateTimeActual()");
		
		if(form == null || form.getEmployee_id() == null || form.getAgent_day_id() == 0 || form.getStart_date_planned() == null || (form.getStart_date_updated() == null && form.getEnd_date_updated() == null) ) {
			logger.error("Form does not contains all required fields, aborting... " + (form.getAgent_day_id() != 0 ? (" Day id : " + form.getAgent_day_id()) : "" ));
			return;
		}
		
		logger.info("Day id = " + form.getAgent_day_id() + ", break start time planned : " + form.getStart_date_planned());
		
		// retrieve agent's details
		EmployeeDataForm empForm = new EmployeeDataForm();
		empForm.setIdNumber(form.getEmployee_id());
		EmployeeDataModel empModel = new EmployeeDataModel(empForm);
		try {
			empModel.populateByEmpIdNum();
		} catch (ShfException e1) {
			logger.error("Could not retrieve user details from DB, aborting...");
			return;
		}
		Calendar cal = Calendar.getInstance();
		cal.setTime(form.getStart_date_planned());
		cal.set(Calendar.SECOND, 0);
		
		// retrieve break details
		BreakBean breakBean = new BreakBean();
		breakBean.setAgentDayId(form.getAgent_day_id());
		breakBean.setAllowedMoked(SHFTableUtils.getMokedCodeOf(empForm.getOrgUnitId()));
		breakBean.setEmployeeId(String.valueOf(empForm.getEmployeeId()));
		breakBean.setStartTime(cal.getTime());
		breakBean.setUserFirstName("הפסקה");
		breakBean.setUserLastName("אוטומטית");
		
		BreakDataModel breakModel = new BreakDataModel();
		
		try {
			BreakDataModel.populateBreak(breakBean);
		} catch (ShfException e1) {
			logger.error("Exception while populateBreak(), aborting ...");
			return;
		}
		
		if (form.getStart_date_updated() != null) {	////// actual break START
			
			cal.setTime(form.getStart_date_updated());
//			cal.set(Calendar.SECOND, 0);
			
			breakBean.setExitTime(cal.getTime());
			
			try {
				breakModel.exitToBreak(breakBean);
				
				if (empForm.getPhoneCellular() != null || empForm.getPhoneCellular().length() > 0) {	// for sending SMS on break end
					insertBreakSMS(empForm, breakBean);
				}
				logger.info("Update exit to break was successfull");
			} catch (Exception e) {
				logger.error("Exception while exitToBreak()");
			}
			
		} else if (form.getEnd_date_updated() != null) {	////// actual break END
			
			cal.setTime(form.getEnd_date_updated());
//			cal.set(Calendar.SECOND, 0);
			
			breakBean.setEntryTime(cal.getTime());
			
			try {
				breakModel.checkLate(breakBean);
			} catch (ShfException e) {
				logger.error("Exception while checkLate()");
			}
			
			try {
				breakModel.backFromBreak(breakBean);
				logger.info("Update return from break was successfull");
			} catch (ShfException e) {
				logger.error("Exception while backFromBreak()");
			}
		}
		
	} // END Method
	
	public void insertBreakSMS (EmployeeDataForm empForm, BreakBean breakBean) throws DBException {
		logger.debug("Starting insertBreakSMS(), shift id : " + breakBean.getAgentDayId());
		
		if(empForm == null || breakBean == null)
			throw new IllegalArgumentException("Arguments can not be NULL");
		
		StringBuffer sql = new StringBuffer();
		int param = 1;

		sql.append("INSERT INTO SHIFTER.SHF_BREAK_SMS ( ");
		sql.append("SMS_ID,  ");
		sql.append("AGENT_CEL_NUM,  ");
		sql.append("AGENT_ID,  ");
		sql.append("SHIFT_DAY_ID,  ");
		sql.append("BREAK_END,  ");
		sql.append("CREATION_DATE )");
		sql.append("VALUES(SHIFTER.SHF_BREAK_SMS_ID.NEXTVAL, ?, ?, ?, ?, ? ) ");
		
		Calendar actualBreakEnd = Calendar.getInstance();
		actualBreakEnd.setTime(breakBean.getExitTime());
		actualBreakEnd.add(Calendar.MINUTE, breakBean.getDuration());
		
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			
			db.setString(param++, empForm.getPhoneCellular());
			db.setString(param++, empForm.getIdNumber());
			db.setLong(param++, breakBean.getAgentDayId());
			db.setTimestamp(param++, actualBreakEnd.getTime());
			db.setTimestamp(param++, new Date());

			db.executeUpdate();
		} catch (DBException e) {
			logger.error("DB error while insert : " + e.getMessage(), e);
			throw e;
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection : " + e.getMessage(), e);
				throw e;
			}
		}
	} // END METHOD
	
	public void logout () {
		logger.info("Starting logout(), params are : uid - "+form.getUid() +", date - "+form.getDate()+", param - "+form.getParam());
	}

	
//------------------------------Getters \ Setters------------------------------

	public SoftPhoneForm getForm() {
		return form;
	}

	public void setForm(SoftPhoneForm form) {
		this.form = form;
	}

}
