package bzq.shf.model;

import java.util.Date;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.UsageReportBean;
import bzq.shf.forms.UsageReportForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;

public class PlatformModel {
	private static Logger logger = Logger.getLogger(PlatformModel.class);
	UsageReportForm usageForm;
	
	public PlatformModel(UsageReportForm usageForm) {
		this.usageForm = usageForm;
	}

	public PlatformModel() {
		super();
	}

	public void insertMobileAudit(String userid, int actionId) throws ShfException {
		logger.debug("starting insertMobileAudit()");
		
		if (userid == null || userid == "") {
			throw new ShfException("Error in insertMobileAudit(), param 'userid' is invalid, aborting DB insertion ...");
		}

		StringBuffer sql = new StringBuffer();
		sql.append("INSERT INTO shifter.shf_mobile_audit ");
		sql.append("(EMP_ID_NUMBER, ACTION_ID, ACTION_DATE) ");
		sql.append("VALUES (?,?,?)");	// 1,2,3
		
		int param_ind = 1;
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			
			db.setString(param_ind++, userid);	// 1
			db.setInt(param_ind++, actionId);	// 2
			db.setTimestamp(param_ind++, new Date());	// 3
			
			db.executeUpdate();
			
		} catch (DBException e) {
			logger.error("Error in insertMobileAudit() : " +e.getMessage());
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error in insertMobileAudit() while closing db connection :" +e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public Vector<UsageReportBean> populateUsageList() throws ShfException {
		logger.debug("Starting populateUsageList()");
		
		Vector<UsageReportBean> result = null;
		
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT a.action_date, e.first_name, e.last_name, e.emp_id_number, e.employee_id, r.action_id, r.action_name, e.inner_job_id, e.org_unit_id ");
		sql.append("FROM shifter.shf_mobile_audit a ");
		sql.append("LEFT JOIN shifter.shf_mobile_audit_ref r ON r.action_id = a.action_id ");
		sql.append("LEFT JOIN SHIFTER.shf_employees e ON e.emp_id_number = a.emp_id_number ");
		sql.append("LEFT JOIN shifter.shf_org_unit u ON u.org_unit_id = e.org_unit_id ");
		sql.append("LEFT JOIN shifter.shf_inner_jobs j ON j.inner_job_id = e.inner_job_id ");

		sql.append("WHERE e.emp_id_number IS NOT NULL ");
		sql.append("AND trunc(a.action_date) BETWEEN ? AND ? ");	// 1, 2
		
		if (usageForm.getMoked() != null && ! "-1".equals(usageForm.getMoked()) ) {
			sql.append("AND u.parent_unit = ? ");	// 3
		}
		
		if (usageForm.getInnerJob() != null && ! "00".equals(usageForm.getInnerJob()[0]) ) {
			sql.append("AND e.inner_job_id in ( ");	// 4
			for (int i=0; i<usageForm.getInnerJob().length; i++) {
				sql.append("?");
				if (i<usageForm.getInnerJob().length-1) {
					sql.append(",");
				}
			}
			sql.append(" ) ");
		}
		
		if (usageForm.getFormAction() != null && ! "00".equals(usageForm.getFormAction()) ) {
			sql.append("AND a.action_id = ? ");	// 5
		}
		
		sql.append("AND e.status_id = ? ");	// 6
		sql.append("AND ROWNUM <= 2000 ");
		sql.append("ORDER BY a.action_date DESC");
		
		DBAccess db = null;
		int param = 1;
		try{
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setDate(param++, SHFUtils.formatStringToDate(usageForm.getDateFrom(), "dd/MM/yyyy"));	// 1
			db.setDate(param++, SHFUtils.formatStringToDate(usageForm.getDateTo(), "dd/MM/yyyy"));		// 2
			
			if (usageForm.getMoked() != null && ! "-1".equals(usageForm.getMoked()) ) {
				db.setString(param++, usageForm.getMoked());	// 3
			}
			
			if (usageForm.getInnerJob() != null && ! "00".equals(usageForm.getInnerJob()[0]) ) {
				for (int i=0; i<usageForm.getInnerJob().length; i++) {
					db.setInt(param++, Integer.parseInt(usageForm.getInnerJob()[i]));	// 4
				}
			}
			
			if (usageForm.getFormAction() != null && ! "00".equals(usageForm.getFormAction()) ) {
				db.setInt(param++, Integer.parseInt(usageForm.getFormAction()));	// 5
			}
			
			db.setInt(param++,SHFConstants.EMPLOYEE_STATUS_ACTIVE);	// 6

			db.executeQuery();
			result = new Vector<UsageReportBean>();
			db.populate("bzq.shf.bean.UsageReportBean", result);
			
		} catch(DBQueryNoRowsException e) {
			logger.debug("No DB results for method populateUsageList()");
		} catch (DBException e) {
			logger.error("Error in populateUsageList() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally {
			try {
				sql = null;
				db.close();
			} catch (DBException e) {
				logger.error("Error in populateUsageList() while closing DB connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
				throw new ShfException(actionErrors);
			}
		}
		 
		return result;
		
	}
	
	public void setFormDefaults() throws ShfException {
		logger.debug("Starting setFormDefaults()");
		
		Date now = new Date();
		usageForm.setDateFrom(SHFUtils.formatDateToString(now, "dd/MM/yyyy"));
		usageForm.setDateTo(SHFUtils.formatDateToString(now, "dd/MM/yyyy"));
		
		usageForm.setMoked("-1");
		
		String[] arr={"00"};
		usageForm.setInnerJob(arr);
		
		usageForm.setFormAction("00");
		
	}
}
