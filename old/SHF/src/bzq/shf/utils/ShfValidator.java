/*
 * Created on 09/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import java.io.Serializable;
import java.util.Date;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.validator.Field;
import org.apache.commons.validator.ValidatorAction;
import org.apache.commons.validator.ValidatorUtil;
import org.apache.struts.action.ActionErrors;

import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShfValidator implements Serializable{
	public static boolean validateFutureDate(Object bean,ValidatorAction va, Field field,ActionErrors errors, 
		HttpServletRequest request, ServletContext application) {
		
		String value = ValidatorUtil.getValueAsString(bean, field.getProperty());
		Date date=null;
    	try {
			date=BaseConvert.stringToDate(value,"dd/MM/yyyy");
		} catch (ConvertException e) {
			return false;
		}
		if(date.after(new Date()))
			return true;
		return false;
				
	}
}
