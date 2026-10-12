package bzq.wfm.report;

import java.io.IOException;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.forms.TableForm;
import bzq.shf.actions.BaseAction;

public class ScheduleForecastAction extends BaseAction{
	
		
	
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		response.setHeader("Cache-Control","no-cache");
		response.setHeader("Pragma","no-cache"); 
		response.setContentType("application/octet-stream");
		
		ActionForward result=null;
		WfmReportForm wfmReportForm=(WfmReportForm)form;

		String scheduleId=wfmReportForm.getScheduleId();
		ArrayList<TableForm> forecasts=ScheduleReportModel.getAvailableForecasts(scheduleId);
		request.setAttribute("forecasts", forecasts);
		result=mapping.findForward("success");
		return result;
	}
	
	
}
