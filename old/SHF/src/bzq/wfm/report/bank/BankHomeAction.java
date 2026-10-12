package bzq.wfm.report.bank;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.actions.AttendanceDataAction;
import bzq.shf.actions.BaseAction;
import bzq.shf.utils.SHFUtils;

public class BankHomeAction extends BaseAction{
	
	private Logger logger = Logger.getLogger(AttendanceDataAction.class);
	private static SimpleDateFormat sdf=new SimpleDateFormat("dd/MM/yyyy");
		
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		BankReportForm bankReportForm=(BankReportForm)form;
		
		String mode=bankReportForm.getMode();
		
		if("build".equals(mode)){
			System.out.println(bankReportForm.getAgaf());
			System.out.println(bankReportForm.getMoked());
			System.out.println(bankReportForm.getFromDate());
			System.out.println(bankReportForm.getToDate());
			
			String[] innerJobs=bankReportForm.getInnerJob();
			if(innerJobs==null || innerJobs[0].equals("00")){
				ActionError actionError=new ActionError("shf.error.chooseInnerJob");
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add("SHF", actionError);
				saveErrors(request, actionErrors);
			}
		}else{
			Date d1=SHFUtils.getNextNWeekDate(new Date());
			bankReportForm.setFromDate(sdf.format(d1));
			d1=SHFUtils.getNextNWeekDate(d1);
			bankReportForm.setToDate(sdf.format(d1));
		}
			
		request.setAttribute("bankReportForm", bankReportForm);
		
		result=mapping.findForward("success");
		return result;
	}
	
	
	
	
}
